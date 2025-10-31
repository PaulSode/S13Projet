from rest_framework import serializers
from .models import Country, Attraction, UserAttractionList, AttractionLike, UserProfile

class CountrySerializer(serializers.ModelSerializer):
    attractions_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Country
        fields = ['id', 'name', 'code', 'capital', 'attractions_count']
    
    def get_attractions_count(self, obj):
        return obj.attractions.filter(is_active=True).count()

class AttractionListSerializer(serializers.ModelSerializer):
    country_name = serializers.CharField(source='country.name', read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    main_image = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    
    class Meta:
        model = Attraction
        fields = [
            'id', 'tripadvisor_id', 'name', 'city', 
            'country_name', 'latitude', 'longitude', 'price_level',
            'rating', 'num_reviews', 'num_likes', 'category',
            'main_image', 'is_liked', 'is_saved'
        ]
    
    def get_main_image(self, obj):
        if obj.images and len(obj.images) > 0:
            return obj.images[0]
        return None
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return AttractionLike.objects.filter(user=request.user, attraction=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserAttractionList.objects.filter(user=request.user, attraction=obj).exists()
        return False
    
    def get_category(self, obj):
        return obj.category.name if obj.category else None

class AttractionDetailSerializer(serializers.ModelSerializer):
    country = CountrySerializer(read_only=True)
    is_liked = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()
    similar_attractions = serializers.SerializerMethodField()
    category = serializers.SerializerMethodField()
    
    class Meta:
        model = Attraction
        fields = [
            'id', 'tripadvisor_id', 'name', 'description', 'category',
            'country', 'city', 'address', 'latitude', 'longitude',
            'phone', 'website', 'email', 'price_level', 'opening_hours',
            'rating', 'num_reviews', 'ranking',
            'images', 'awards', 'category',
            'attraction_groups', 'num_likes', 'saves_count',
            'is_liked', 'is_saved', 'similar_attractions', 'created_at'
        ]
    
    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return AttractionLike.objects.filter(user=request.user, attraction=obj).exists()
        return False
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return UserAttractionList.objects.filter(user=request.user, attraction=obj).exists()
        return False
    
    def get_similar_attractions(self, obj):
        similar = Attraction.objects.filter(
            city=obj.city,
            category=obj.category,
            is_active=True
        ).exclude(id=obj.id)[:6]
        return AttractionListSerializer(similar, many=True, context=self.context).data
    
    def get_category(self, obj):
        return obj.category.name if obj.category else None

class UserAttractionListSerializer(serializers.ModelSerializer):
    attraction = AttractionListSerializer(read_only=True)
    
    class Meta:
        model = UserAttractionList
        fields = ['id', 'attraction', 'added_at', 'notes', 'visited']

class UserProfileSerializer(serializers.ModelSerializer):
    country = CountrySerializer(source='selected_country', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = ['profile_type', 'country', 'created_at']