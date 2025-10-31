import { useState, useEffect } from "react";
import "./SearchPage.css";

const SearchPage = ({
  API_URL,
  selectedCountry,
  userProfile,
  onSelectAttraction,
  savedAttractions,
  onSaveAttraction
}) => {
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalBudget, setTotalBudget] = useState(0);
  const [distanceSorted, setDistanceSorted] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [categories, setCategories] = useState([]);
  const [priceLevels, setPriceLevels] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    category: null,
    city: "",
    latitude: "",
    longitude: "",
    radius: "",
    min_rating: "",
    min_reviews: "",
    min_photos: "",
    price_level: null,
  });

  useEffect(() => {
  fetchCategories();
  fetchPriceLevels();
}, []);

const fetchCategories = async () => {
  try {
    const res = await fetch(`${API_URL}/categorys/`);
    const data = await res.json();
    setCategories([{ id: "", name: "Toutes catégories" }, ...data]);
  } catch (error) {
    console.error("Erreur chargement catégories:", error);
  }
};

const fetchPriceLevels = async () => {
  try {
    const res = await fetch(`${API_URL}/pricelevels/`);
    const data = await res.json();
    setPriceLevels([{ value: "", label: "Tous prix" }, ...data]);
  } catch (error) {
    console.error("Erreur chargement niveaux de prix:", error);
  }
};

useEffect(() => {
  fetchCategories();
  fetchPriceLevels();
}, []);


  // Récupérer la localisation de l'utilisateur
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setFilters((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
        },
        (error) => console.log("Geolocation non disponible:", error)
      );
    }
  }, []);

  useEffect(() => {
    fetchAttractions();
  }, [selectedCountry]);

const fetchAttractions = async () => {
  setLoading(true);
  try {
    let url = `${API_URL}/attractions/popular/?country=${selectedCountry.id}&profile_type=${userProfile}`;

    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.category) url += `&category=${filters.category}`;
    if (filters.city) url += `&city=${encodeURIComponent(filters.city)}`;

    if (filters.latitude && filters.longitude && filters.radius) {
      url += `&latitude=${filters.latitude}&longitude=${filters.longitude}&radius=${filters.radius}`;
    }

    if (filters.min_rating) url += `&min_rating=${filters.min_rating}`;
    if (filters.min_reviews) url += `&min_reviews=${filters.min_reviews}`;
    if (filters.min_photos) url += `&min_photos=${filters.min_photos}`;
    if (filters.price_level) url += `&price_level=${filters.price_level}`;
    url += "&language=fr";

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erreur serveur (${response.status})`);
    const data = await response.json();

    setAttractions(data.results || data);
    calculateBudget(data.results || data);
  } catch (error) {
    console.error("Erreur lors de la récupération des attractions:", error);
  } finally {
    setLoading(false);
  }
};


  const calculateBudget = (attractionsList) => {
    const priceMap = {
      free: 0,
      budget: 10,
      moderate: 25,
      expensive: 50,
      luxury: 100,
    };
    const total = attractionsList.reduce((sum, attr) => {
      const isSaved = savedAttractions.some((a) => a.id === attr.id);
      return isSaved ? sum + (priceMap[attr.price_level] || 0) : sum;
    }, 0);
    setTotalBudget(total);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSearch = () => {
    setDistanceSorted(false);
    fetchAttractions();
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      category: "",
      city: "",
      latitude: userLocation.lat?.toString() || "",
      longitude: userLocation.lng?.toString() || "",
      radius: "",
      min_rating: "",
      min_reviews: "",
      min_photos: "",
      price_level: "",
    });
    setDistanceSorted(false);
    setTimeout(() => fetchAttractions(), 100);
  };

  const isSaved = (attraction) => savedAttractions.some((a) => a.id === attraction.id);

  const handleSave = (attraction) => {
    onSaveAttraction(attraction);
    calculateBudget(attractions);
  };

  return (
  <div className="search-page">
    <div className="filters-panel">
      <h2 className="filters-title">Filtres de recherche</h2>

      {/* Recherche texte */}
      <div className="filter-group">
        <label>Recherche</label>
        <input
          type="text"
          placeholder="Nom de l'attraction..."
          value={filters.search}
          onChange={(e) => handleFilterChange("search", e.target.value)}
          className="filter-input"
        />
      </div>

      {/* Catégorie depuis la BDD */}
      <div className="filter-group">
        <label>Catégorie</label>
        <select
          value={filters.category}
          onChange={(e) => handleFilterChange("category", e.target.value)}
          className="filter-select"
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Ville */}
      <div className="filter-group">
        <label>Ville</label>
        <input
          type="text"
          placeholder="Nom de la ville..."
          value={filters.city}
          onChange={(e) => handleFilterChange("city", e.target.value)}
          className="filter-input"
        />
      </div>

      {/* Note minimum */}
      <div className="filter-group">
        <label>Note minimum</label>
        <input
          type="number"
          placeholder="Ex: 4.0"
          value={filters.min_rating}
          onChange={(e) => handleFilterChange("min_rating", e.target.value)}
          className="filter-input"
          min="1"
          max="5"
          step="0.1"
        />
      </div>

      {/* Nombre minimum d'avis */}
      <div className="filter-group">
        <label>Nombre minimum d'avis</label>
        <input
          type="number"
          placeholder="Ex: 100"
          value={filters.min_reviews}
          onChange={(e) => handleFilterChange("min_reviews", e.target.value)}
          className="filter-input"
          min="0"
        />
      </div>

      {/* Nombre minimum de photos */}
      <div className="filter-group">
        <label>Nombre minimum de photos</label>
        <input
          type="number"
          placeholder="Ex: 1"
          value={filters.min_photos}
          onChange={(e) => handleFilterChange("min_photos", e.target.value)}
          className="filter-input"
          min="0"
        />
      </div>

      {/* Niveau de prix depuis la BDD */}
      <div className="filter-group">
        <label>Niveau de prix</label>
        <select
          value={filters.price_level}
          onChange={(e) => handleFilterChange("price_level", e.target.value)}
          className="filter-select"
        >
          {priceLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Localisation GPS */}
      <div className="filter-group">
        <label>📍 Localisation GPS</label>
        <div className="filter-row">
          <input
            type="number"
            placeholder="Latitude"
            value={filters.latitude}
            onChange={(e) => handleFilterChange("latitude", e.target.value)}
            className="filter-input-small"
            step="0.000001"
          />
          <input
            type="number"
            placeholder="Longitude"
            value={filters.longitude}
            onChange={(e) => handleFilterChange("longitude", e.target.value)}
            className="filter-input-small"
            step="0.000001"
          />
        </div>
        <input
          type="number"
          placeholder="Rayon (km)"
          value={filters.radius}
          onChange={(e) => handleFilterChange("radius", e.target.value)}
          className="filter-input"
          min="1"
        />
      </div>

      {/* Boutons d'action */}
      <div className="filter-actions">
        <button className="btn-apply" onClick={handleSearch}>
          Appliquer filtres
        </button>
        <button className="btn-reset" onClick={resetFilters}>
          Réinitialiser
        </button>
      </div>

      {/* Affichage du budget total */}
      {totalBudget > 0 && (
        <div className="budget-summary">
          <h3>Budget de ma liste</h3>
          <p className="budget-amount">${totalBudget}</p>
        </div>
      )}
    </div>

    {/* Résultats */}
    <div className="results-panel">
      <div className="results-header">
        <h2 className="results-title">
          {attractions.length} attraction{attractions.length > 1 ? "s" : ""} trouvée
          {attractions.length > 1 ? "s" : ""}
        </h2>
      </div>

      {loading ? (
        <div className="loading">Recherche en cours...</div>
      ) : attractions.length === 0 ? (
        <div className="no-results">
          <p>Aucune attraction trouvée. Essayez d'autres filtres.</p>
        </div>
      ) : (
        <div className="results-grid">
          {attractions.map((attraction, index) => (
            <div key={attraction.id} className="result-card">
              {distanceSorted && (
                <div className="route-number">{index + 1}</div>
              )}

              <div
                className="result-image"
                style={{
                  backgroundImage: `url(${
                    attraction.main_image || "https://via.placeholder.com/300x200"
                  })`,
                }}
              >
                <button
                  className={`save-badge ${isSaved(attraction) ? "saved" : ""}`}
                  onClick={() => handleSave(attraction)}
                  title={
                    isSaved(attraction)
                      ? "Retirer de ma liste"
                      : "Ajouter à ma liste"
                  }
                >
                  {isSaved(attraction) ? "✅" : "💾"}
                </button>
              </div>

              <div className="result-content">
                <h3 className="result-title">{attraction.name}</h3>

                {attraction.category && (
                  <p className="result-category">{attraction.category}</p>
                )}

                {attraction.city && (
                  <p className="result-location">{attraction.city}</p>
                )}

                <div className="result-meta">
                  {attraction.rating && (
                    <span className="result-rating">⭐ {attraction.rating}</span>
                  )}
                  {attraction.num_reviews && (
                    <span className="result-reviews">
                      💬 {attraction.num_reviews} avis
                    </span>
                  )}
                </div>

                <div className="result-stats">
                  {attraction.num_likes !== undefined && (
                    <span className="stat-likes">❤️ {attraction.num_likes}</span>
                  )}
                  {attraction.price_level && (
                    <span className="stat-price">
                      {"$".repeat(
                        ["free", "budget", "moderate", "expensive", "luxury"].indexOf(
                          attraction.price_level
                        ) + 1
                      )}
                    </span>
                  )}
                </div>

                <button
                  className="btn-details"
                  onClick={() => onSelectAttraction(attraction.id)}
                >
                  Voir détails
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)};

export default SearchPage;
