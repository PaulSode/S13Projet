# tourism/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'countries', views.CountryViewSet, basename='country')
router.register(r'attractions', views.AttractionViewSet, basename='attraction')
router.register(r'my-attractions', views.UserAttractionListViewSet, basename='my-attractions')

urlpatterns = [
    path('', include(router.urls)),
]

# Les endpoints disponibles seront :
# GET  /api/countries/                           → Liste des pays
# GET  /api/countries/{id}/                      → Détail d'un pays
# GET  /api/countries/{id}/popular_attractions/ → Attractions populaires
# GET  /api/countries/{id}/search_tripadvisor/  → Rechercher via TripAdvisor
#
# GET  /api/attractions/                        → Liste attractions (avec filtres)
# GET  /api/attractions/{id}/                   → Détail attraction
# GET  /api/attractions/popular/                → Les plus populaires
# GET  /api/attractions/by_distance/            → Triées par distance
# GET  /api/attractions/{id}/details_from_tripadvisor/ → Détails TripAdvisor
# POST /api/attractions/{id}/like/              → Ajouter un like
# POST /api/attractions/{id}/save/              → Ajouter à ma liste
#
# GET  /api/my-attractions/                     → Ma liste
# GET  /api/my-attractions/by_distance/         → Ma liste par distance
# GET  /api/my-attractions/budget_total/        → Budget total