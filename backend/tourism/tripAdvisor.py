import os
import requests
from django.conf import settings

class TripAdvisorService:
    BASE_URL = "https://api.content.tripadvisor.com/api/v1"
    
    def __init__(self):
        self.api_key = settings.TRIPADVISOR_API_KEY
        self.headers = {
            'accept': 'application/json',
        }
    
    def search_locations(self, query, latitude=None, longitude=None):
        """Rechercher des lieux"""
        url = f"{self.BASE_URL}/location/nearby_search"
        params = {
            'key': self.api_key,
            'searchQuery': query,
            'language': 'fr'
        }
        if latitude and longitude:
            params['latLong'] = f"{latitude},{longitude}"
        
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def get_location_details(self, location_id):
        """Obtenir les détails d'un lieu"""
        url = f"{self.BASE_URL}/location/{location_id}/details"
        params = {
            'key': self.api_key,
            'language': 'fr'
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def get_location_photos(self, location_id):
        """Obtenir les photos d'un lieu"""
        url = f"{self.BASE_URL}/location/{location_id}/photos"
        params = {
            'key': self.api_key,
            'language': 'fr'
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()
    
    def get_location_reviews(self, location_id):
        """Obtenir les avis d'un lieu"""
        url = f"{self.BASE_URL}/location/{location_id}/reviews"
        params = {
            'key': self.api_key,
            'language': 'fr'
        }
        
        response = requests.get(url, headers=self.headers, params=params)
        return response.json()