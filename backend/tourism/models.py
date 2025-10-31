from random import choices
from django.db import models
from django.contrib.auth.models import User

# Choix pour les champs de texte
class ProfileType(models.TextChoices):
    LOCAL = 'local', 'Local'
    TOURIST = 'tourist', 'Touriste'
    PROFESSIONAL = 'professional', 'Professionnel'

class PriceLevel(models.TextChoices):
    FREE = 'free', 'Gratuit'
    BUDGET = 'budget', '$'
    MODERATE = 'moderate', '$$'
    EXPENSIVE = 'expensive', '$$$'
    LUXURY = 'luxury', '$$$$'

class CategoryType(models.TextChoices):
    RESTAURANT = 'restaurant', 'Restaurant'
    HOTEL = 'hotel', 'Hôtel'
    MONUMENT = 'monument', 'Monument'
    MUSEUM = 'museum', 'Musée'
    PARK = 'park', 'Parc'
    ACTIVITY = 'activity', 'Activité'
    SHOPPING = 'shopping', 'Shopping'
    NIGHTLIFE = 'nightlife', 'Vie nocturne'

# Modèles
class Country(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=3, unique=True)
    capital = models.CharField(max_length=100)
    capital_latitude = models.DecimalField(max_digits=10, decimal_places=7)
    capital_longitude = models.DecimalField(max_digits=10, decimal_places=7)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Countries"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class Category(models.Model):
    name = models.CharField(max_length=100, choices=CategoryType.choices, unique=True)
    description = models.TextField(blank=True)
    
    def __str__(self):
        return self.name

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_type = models.CharField(max_length=20, choices=ProfileType.choices, default=ProfileType.TOURIST)
    country = models.ForeignKey(Country, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.profile_type}"

class Attraction(models.Model):
    # Identifiants TripAdvisor
    tripadvisor_id = models.CharField(max_length=100, unique=True)
    
    # Informations de base
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Localisation
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='attractions')
    city = models.CharField(max_length=100)
    address = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=7)
    longitude = models.DecimalField(max_digits=10, decimal_places=7)

    # Contact
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    email = models.EmailField(blank=True)
    
    # Informations commerciales
    price_level = models.CharField(max_length=20, choices=PriceLevel.choices, default=PriceLevel.BUDGET)
    
    # Horaires
    opening_hours = models.JSONField(default=dict, blank=True)
    
    # TripAdvisor données
    num_reviews = models.IntegerField(default=0)
    num_photos = models.IntegerField(default=0)
    num_likes = models.IntegerField(default=0)
    ranking = models.IntegerField(null=True, blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, null=True, blank=True)
    saves_count = models.IntegerField(default=0)
    
    # Images et récompenses
    images = models.JSONField(default=list, blank=True)
    awards = models.JSONField(default=list, blank=True)

    # Métadonnées
    attraction_groups = models.JSONField(default=dict, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-num_likes', '-rating']
        indexes = [
            models.Index(fields=['country', 'city']),
            models.Index(fields=['category']),
            models.Index(fields=['-num_likes']),
            models.Index(fields=['price_level']),
            models.Index(fields=['ranking']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.city}"

class AttractionImage(models.Model):
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name='media_files')
    image_file = models.ImageField(upload_to='gallery/%Y/%m/')
    caption = models.CharField(max_length=255, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    
    class Meta:
        ordering = ['order']
    def __str__(self):
        return f"Image for {self.attraction.name} - {self.caption}"

class UserAttractionList(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attraction_lists')
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE)
    added_at = models.DateTimeField(auto_now_add=True)
    notes = models.TextField(blank=True)
    visited = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['user', 'attraction']
        ordering = ['-added_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.attraction.name}"

class AttractionLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    attraction = models.ForeignKey(Attraction, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['user', 'attraction']
    
    def __str__(self):
        return f"{self.user.username} likes {self.attraction.name}"