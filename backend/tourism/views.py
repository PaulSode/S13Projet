from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from django.db.models import Q, Count
from django.core.cache import cache
from .models import Country, Attraction, UserAttractionList, AttractionLike, Category
from .serializers import (
    CountrySerializer, AttractionListSerializer, 
    AttractionDetailSerializer, UserAttractionListSerializer
)
from .tripAdvisor import TripAdvisorService
import math

tripadvisor = TripAdvisorService()

class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Country.objects.all()
    serializer_class = CountrySerializer
    
    @action(detail=True, methods=['get'])
    def popular_attractions(self, request, pk=None):
        """Retourne les attractions les plus populaires d'un pays"""
        country = self.get_object()
        attractions = Attraction.objects.filter(
            country=country,
            is_active=True
        ).order_by('-num_likes', '-rating')[:10]
        print(attractions)
        
        serializer = AttractionListSerializer(
            attractions, 
            many=True, 
            context={'request': request}
        )
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def search_tripadvisor(self, request, pk=None):
        country = self.get_object()
        query = request.query_params.get('q', '').strip()

        tripadvisor = TripAdvisorService()
        latitude = country.capital_latitude
        longitude = country.capital_longitude

        results = tripadvisor.search_locations(query, latitude, longitude)

        if not results or 'data' not in results:
            return Response({'error': 'Aucun résultat trouvé.'}, status=404)

        formatted_results = []
        for item in results['data'][:20]:
            attraction, _ = Attraction.objects.update_or_create(
                tripadvisor_id=item.get('location_id'),
                defaults={
                    'country': country,
                    'city': country.capital,
                    'name': item.get('name'),
                    'tripadvisor_id': item.get('location_id'),
                    'address': item.get('address_obj', {}).get('address_string', ''),
                    'latitude': country.capital_latitude,
                    'longitude': country.capital_longitude,
                    'is_active': True,
                }
            )


            formatted_results.append(attraction)

        serializer = AttractionListSerializer(
            formatted_results,
            many=True,
            context={'request': request}
        )
        return Response(serializer.data)

class AttractionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Attraction.objects.filter(is_active=True)
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description', 'city']
    ordering_fields = ['rating', 'num_reviews', 'num_likes', 'price_level']
    ordering = ['-num_likes', '-rating']
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AttractionDetailSerializer
        return AttractionListSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        country = self.request.query_params.get('country')
        if country:
            queryset = queryset.filter(country_id=country)
        
        city = self.request.query_params.get('city')
        if city:
            queryset = queryset.filter(city__icontains=city)
        
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        price_level = self.request.query_params.get('price_level')
        if price_level:
            queryset = queryset.filter(price_level=price_level)
        
        min_reviews = self.request.query_params.get('min_reviews')
        if min_reviews:
            queryset = queryset.filter(num_reviews__gte=min_reviews)
        
        min_photos = self.request.query_params.get('min_photos')
        if min_photos:
            queryset = queryset.annotate(
                photos_count=Count('images')
            ).filter(photos_count__gte=min_photos)
        
        min_rating = self.request.query_params.get('min_rating')
        if min_rating:
            queryset = queryset.filter(tripadvisor_rating__gte=min_rating)
        
        latitude = self.request.query_params.get('latitude')
        longitude = self.request.query_params.get('longitude')
        radius = self.request.query_params.get('radius')  # en km
        
        if latitude and longitude and radius:
            lat = float(latitude)
            lon = float(longitude)
            r = float(radius)
            
            filtered_ids = []
            for attraction in queryset:
                distance = self._calculate_distance(
                    lat, lon,
                    float(attraction.latitude),
                    float(attraction.longitude)
                )
                if distance <= r:
                    filtered_ids.append(attraction.id)
            
            queryset = queryset.filter(id__in=filtered_ids)
        
        profile_type = self.request.query_params.get('profile_type')
        if profile_type:
            if profile_type == 'local':
                queryset = queryset.filter(
                    Q(category__name='restaurant') | Q(category__name='attraction')
                )
            elif profile_type == 'tourist':
                queryset = queryset.filter(
                    Q(category__name='restaurant') | Q(category__name='attraction') | 
                    Q(category__name='hotel') | Q(category__name='geo')
                )
            elif profile_type == 'professional':
                queryset = queryset.filter(
                    Q(category__name='hotel') | Q(category__name='restaurant')
                )
        
        return queryset
    
    def _calculate_distance(self, lat1, lon1, lat2, lon2):
        R = 6371  # Rayon de la Terre en km
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat / 2) * math.sin(dlat / 2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon / 2) * math.sin(dlon / 2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance = R * c
        
        return distance
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        country = request.query_params.get('country')
        city = request.query_params.get('city')
        search = self.request.query_params.get('search')
        
        queryset = self.get_queryset()
        
        if country:
            queryset = queryset.filter(country_id=country)
        if city:
            queryset = queryset.filter(city__icontains=city)
        if search:
            queryset = queryset.filter(name__icontains=search)
        
        popular = queryset[:20]
        serializer = self.get_serializer(popular, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_distance(self, request):
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attractions = list(self.get_queryset())
        sorted_attractions = self._sort_by_distance(
            attractions,
            float(latitude),
            float(longitude)
        )
        
        serializer = self.get_serializer(sorted_attractions, many=True)
        return Response(serializer.data)
    
    def _sort_by_distance(self, attractions, start_lat, start_lon):
        if not attractions:
            return attractions
        
        sorted_attractions = []
        remaining = attractions.copy()
        current_lat, current_lon = start_lat, start_lon
        
        while remaining:
            nearest = min(
                remaining,
                key=lambda a: self._calculate_distance(
                    current_lat, current_lon,
                    float(a.latitude), float(a.longitude)
                )
            )
            sorted_attractions.append(nearest)
            remaining.remove(nearest)
            current_lat, current_lon = float(nearest.latitude), float(nearest.longitude)
        
        return sorted_attractions
    
    @action(detail=True, methods=['get'])
    def details_from_tripadvisor(self, request, pk=None):
        """
        Récupère les détails TripAdvisor pour une attraction et les sauvegarde en base.
        """
        attraction = self.get_object()
        
        if not attraction.tripadvisor_id:
            return Response(
                {'error': 'No TripAdvisor ID for this attraction'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f'tripadvisor_details_{attraction.tripadvisor_id}'
        cached_data = cache.get(cache_key)
        
        if cached_data:
            return Response(cached_data)
        
        tripadvisor = TripAdvisorService()
        details = tripadvisor.get_location_details(attraction.tripadvisor_id)
        photos = tripadvisor.get_location_photos(attraction.tripadvisor_id)
        reviews = tripadvisor.get_location_reviews(attraction.tripadvisor_id)

        # --- Mise à jour en base ---
        attraction.name = details.get('name', attraction.name)
        attraction.description = details.get('description', attraction.description)
        attraction.city = details.get('address_obj', {}).get('city', attraction.city)
        attraction.address = details.get('address_obj', {}).get('address_string', attraction.address)
        attraction.latitude = details.get('latitude', attraction.latitude)
        attraction.longitude = details.get('longitude', attraction.longitude)
        attraction.phone = details.get('phone', attraction.phone)
        attraction.website = details.get('website', attraction.website)
        attraction.rating = details.get('rating', attraction.rating)
        attraction.num_reviews = details.get('num_reviews', attraction.num_reviews)
        attraction.num_photos = details.get('photo_count', attraction.num_photos)
        attraction.images = [p['images']['original']['url'] for p in photos.get('data', [])]
        attraction.awards = details.get('awards', [])
        
        # Category
        cat = details.get('category', {}).get('name')
        if cat:
            attraction.category = Category.objects.get_or_create(name=cat)[0]
            pass
        
        attraction.save()
        
        response_data = {
            'details': details,
            'photos': photos,
            'reviews': reviews
        }
        
        cache.set(cache_key, response_data, 3600)
        return Response(response_data)

    
    @action(detail=True, methods=['post'])
    def like(self, request, pk=None):
        attraction = self.get_object()
        like, created = AttractionLike.objects.get_or_create(
            user=request.user,
            attraction=attraction
        )
        
        if not created:
            like.delete()
            attraction.num_likes -= 1
            attraction.save()
            return Response({'liked': False, 'num_likes': attraction.num_likes})
        
        attraction.num_likes += 1
        attraction.save()
        return Response({'liked': True, 'num_likes': attraction.num_likes})
    
    @action(detail=True, methods=['post'])
    def save(self, request, pk=None):
        attraction = self.get_object()
        saved_item, created = UserAttractionList.objects.get_or_create(
            user=request.user,
            attraction=attraction
        )
        
        if not created:
            saved_item.delete()
            return Response({'saved': False})
        
        return Response({'saved': True})

class UserAttractionListViewSet(viewsets.ModelViewSet):
    serializer_class = UserAttractionListSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        return UserAttractionList.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def by_distance(self, request):
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        my_list = self.get_queryset()
        attractions = [item.attraction for item in my_list]
        
        sorted_attractions = self._sort_by_distance(
            attractions,
            float(latitude),
            float(longitude)
        )
        
        serializer = AttractionListSerializer(sorted_attractions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def budget_total(self, request):
        my_list = self.get_queryset()
        
        price_mapping = {
            'free': 0,
            'budget': 10,
            'moderate': 25,
            'expensive': 50,
            'luxury': 100
        }
        
        total_budget = sum(
            price_mapping.get(item.attraction.price_level, 0)
            for item in my_list
        )
        
        return Response({
            'total_budget': total_budget,
            'count': my_list.count()
        })
    
    def _sort_by_distance(self, attractions, start_lat, start_lon):
        if not attractions:
            return attractions
        
        sorted_attractions = []
        remaining = attractions.copy()
        current_lat, current_lon = start_lat, start_lon
        
        R = 6371  # Rayon Terre en km
        
        while remaining:
            def distance_to(attr):
                dlat = math.radians(float(attr.latitude) - current_lat)
                dlon = math.radians(float(attr.longitude) - current_lon)
                a = math.sin(dlat/2)**2 + math.cos(math.radians(current_lat)) * math.cos(math.radians(float(attr.latitude))) * math.sin(dlon/2)**2
                c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
                return R * c
            
            nearest = min(remaining, key=distance_to)
            sorted_attractions.append(nearest)
            remaining.remove(nearest)
            current_lat, current_lon = float(nearest.latitude), float(nearest.longitude)
        
        return sorted_attractions            