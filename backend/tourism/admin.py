from django.contrib import admin
from django.contrib.auth.models import User
from .models import (
    Country,
    Attraction,
    UserProfile,
    UserAttractionList,
    AttractionLike,
    AttractionImage,
    Category
)

class AttractionImageInline(admin.TabularInline):
    model = AttractionImage
    extra = 1

# --- ADMINISTRATION DES MODÈLES ---

@admin.register(Country)
class CountryAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'capital', 'created_at']
    search_fields = ['name', 'code']

@admin.register(Attraction)
class AttractionAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'city', 'country', 'rating', 'num_reviews', 'num_likes', 'is_active']
    list_filter = ['category', 'country', 'is_active', 'price_level']
    search_fields = ['name', 'city', 'description']
    inlines = [AttractionImageInline] 
    
    readonly_fields = ['created_at', 'updated_at', 'num_likes', 'saves_count', 'num_reviews'] # Lecture seule
    
    fieldsets = (
        ('Informations de base', {
            'fields': ('tripadvisor_id', 'name', 'description', 'category')
        }),
        ('Localisation', {
            'fields': ('country', 'city', 'address', 'latitude', 'longitude')
        }),
        ('Contact', {
            'fields': ('phone', 'website', 'email')
        }),
        ('Informations commerciales', {
            'fields': ('price_level', 'opening_hours')
        }),
        ('TripAdvisor', {
            'fields': ('rating', 'num_reviews', 'ranking')
        }),
        ('Médias (API)', {
            'fields': ('images', 'awards')
        }),
        ('Spécifique', {
            'fields': ['attraction_groups']
        }),
        ('Statistiques & État', {
            'fields': ['num_likes', 'saves_count', 'is_active']
        }),
        ('Métadonnées', {
            'fields': ['created_at', 'updated_at']
        }),
    )

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'profile_type', 'country', 'created_at'] 
    list_filter = ['profile_type', 'country']
    search_fields = ['user__username', 'user__email']
    raw_id_fields = ['user'] 

@admin.register(UserAttractionList)
class UserAttractionListAdmin(admin.ModelAdmin):
    list_display = ['user', 'attraction', 'visited', 'added_at']
    list_filter = ['visited', 'added_at']
    search_fields = ['user__username', 'attraction__name']
    raw_id_fields = ['user', 'attraction'] 

@admin.register(AttractionLike)
class AttractionLikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'attraction', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'attraction__name']
    raw_id_fields = ['user', 'attraction'] 

@admin.register(AttractionImage)
class AttractionImageAdmin(admin.ModelAdmin):
    list_display = ['attraction', 'caption', 'order']
    list_filter = ['attraction']
    raw_id_fields = ['attraction']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    search_fields = ['name']