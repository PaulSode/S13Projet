# TravelGuide - Documentation Technique

## Stack Technique

### Backend
- Django 5.2.7
- Django REST Framework
- SQLite
- Python-dotenv
- Requests (API TripAdvisor)

### Frontend
- React 19.1.1
- Vite 7.1.7
- CSS3

## Installation

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate ou venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Ajouter TRIPADVISOR_API_KEY dans .env
python manage.py migrate
python manage.py loaddata tourism/fixtures/initial_data.json #si pas de clé API, pour pouvoir tester
python manage.py runserver
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://127.0.0.1:8000
- Admin: http://127.0.0.1:8000/admin

## Configuration

### backend/.env
```env
TRIPADVISOR_API_KEY="key"
```

### CORS
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
```

## Structure
```
backend/
├── Solo/                   # Configuration Django
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tourism/
    ├── models.py          # Modèles de données
    ├── views.py           # ViewSets API
    ├── serializers.py     # Sérialiseurs DRF
    ├── urls.py            # Routes API
    ├── admin.py           # Interface admin
    ├── tripAdvisor.py     # Service API externe
    └── fixtures/          # Données initiales

frontend/
└── src/
    ├── components/
    │   ├── landingPage.jsx      # Sélection profil/pays
    │   ├── homePage.jsx         # Carousel + favoris
    │   ├── searchPage.jsx       # Recherche + filtres
    │   ├── attractionPage.jsx   # Détails attraction
    │   └── compilationPage.jsx  # Itinéraire + export
    ├── App.jsx
    └── main.jsx
```

## Modèles de données

### Country
```python
- name: CharField
- code: CharField (unique)
- capital: CharField
- capital_latitude: DecimalField
- capital_longitude: DecimalField
- created_at: DateTimeField
```

### Category
```python
- name: CharField (choices)
- description: TextField
```

### Attraction
```python
- tripadvisor_id: CharField (unique)
- name: CharField
- description: TextField
- category: ForeignKey(Category)
- country: ForeignKey(Country)
- city: CharField
- address: TextField
- latitude/longitude: DecimalField
- phone/website/email: CharField/URLField/EmailField
- price_level: CharField (choices)
- opening_hours: JSONField
- num_reviews/num_photos/num_likes: IntegerField
- ranking: IntegerField
- rating: DecimalField
- images: JSONField
- awards: JSONField
- attraction_groups: JSONField
- is_active: BooleanField
```

### UserProfile
```python
- user: OneToOneField(User)
- profile_type: CharField (choices: local/tourist/professional)
- country: ForeignKey(Country)
- created_at: DateTimeField
```

### UserAttractionList
```python
- user: ForeignKey(User)
- attraction: ForeignKey(Attraction)
- added_at: DateTimeField
- notes: TextField
- visited: BooleanField
```

### AttractionLike
```python
- user: ForeignKey(User)
- attraction: ForeignKey(Attraction)
- created_at: DateTimeField
```

## API Endpoints

### Countries
```
GET    /api/countries/
GET    /api/countries/{id}/
GET    /api/countries/{id}/popular_attractions/
GET    /api/countries/{id}/search_tripadvisor/?q=query
```

### Attractions
```
GET    /api/attractions/
GET    /api/attractions/{id}/
GET    /api/attractions/popular/?country={id}&profile_type={type}
GET    /api/attractions/by_distance/?latitude={lat}&longitude={lng}
GET    /api/attractions/{id}/details_from_tripadvisor/
POST   /api/attractions/{id}/like/
POST   /api/attractions/{id}/save/
```

### User Attractions
```
GET    /api/my-attractions/
GET    /api/my-attractions/by_distance/?latitude={lat}&longitude={lng}
GET    /api/my-attractions/budget_total/
```

## Fonctionnalités Frontend

### Profils utilisateur
- **local**: restaurants + attractions
- **tourist**: tous résultats
- **professional**: hôtels + restaurants

### Filtres de recherche
- Texte, catégorie, ville
- Note, avis, photos
- Prix
- Géolocalisation + rayon

### Budget estimation
```javascript
{
  free: 0$,
  budget: 10$,
  moderate: 25$,
  expensive: 50$,
  luxury: 100$
}
```

## Commandes utiles

### Backend
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py loaddata tourism/fixtures/initial_data.json
python manage.py runserver
```
navigator.geolocation.getCurrentPosition(
  (position) => {
    position.coords.latitude
    position.coords.longitude
  }
)
```
