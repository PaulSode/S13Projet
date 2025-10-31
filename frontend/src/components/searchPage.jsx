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
  const [searchMode, setSearchMode] = useState("database");
  const [totalBudget, setTotalBudget] = useState(0);
  const [distanceSorted, setDistanceSorted] = useState(false);
  const [userLocation, setUserLocation] = useState({ lat: null, lng: null });
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    city: "",
    latitude: "",
    longitude: "",
    radius: "",
    min_rating: "",
    min_reviews: "",
    min_photos: "",
    price_level: "",
  });

  const categories = [
    { value: "", label: "Toutes catégories" },
    { value: "restaurant", label: "Restaurant" },
    { value: "hotel", label: "Hôtel" },
    { value: "monument", label: "Monument" },
    { value: "museum", label: "Musée" },
    { value: "park", label: "Parc" },
    { value: "activity", label: "Activité" },
    { value: "shopping", label: "Shopping" },
    { value: "nightlife", label: "Vie nocturne" },
  ];

  const priceLevels = [
    { value: "", label: "Tous prix" },
    { value: "free", label: "Gratuit" },
    { value: "budget", label: "$" },
    { value: "moderate", label: "$$" },
    { value: "expensive", label: "$$$" },
    { value: "luxury", label: "$$$$" },
  ];

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

      if (filters.search) url += `&search=${filters.search}`;
      if (filters.category) url += `&category=${filters.category}`;
      if (filters.city) url += `&city=${filters.city}`;
      if (filters.latitude && filters.longitude && filters.radius) {
        url += `&latitude=${filters.latitude}&longitude=${filters.longitude}&radius=${filters.radius}`;
      }
      if (filters.min_rating) url += `&min_rating=${filters.min_rating}`;
      if (filters.min_reviews) url += `&min_reviews=${filters.min_reviews}`;
      if (filters.min_photos) url += `&min_photos=${filters.min_photos}`;
      if (filters.price_level) url += `&price_level=${filters.price_level}`;

      const response = await fetch(url);
      const data = await response.json();
      setAttractions(data.results || data);
      calculateBudget(data.results || data);
      setSearchMode("database");
      setLoading(false);

      // fetch(url)
      //   .then((res) => res.json())
      //   .then((data) => {
      //     setAttractions(data);
      //     setLoading(false);
      //   })
      //   .catch((err) => {
      //     console.error("Erreur:", err);
      //     setLoading(false);
      //   });
    } catch (error) {
      console.error("Erreur lors de la récupération des attractions:", error);
      setLoading(false);
    }
  };

  const searchTripAdvisor = async () => {
    if (!filters.search) {
      alert("Veuillez entrer un terme de recherche");
      return;
    }

    setLoading(true);
    try {
      const url = `${API_URL}/countries/${selectedCountry.id}/search_tripadvisor/?q=${filters.search}`;
      const response = await fetch(url);
      const data = await response.json();
      
      // Transformer les résultats TripAdvisor
      const formattedResults = data.map((item) => ({
        id: item.id,
        name: item.name,
        latitude: item.latitude,
        longitude: item.longitude,
        result_type: item.result_type,
        tripadvisor_url: item.tripadvisor_url,
        source: "tripadvisor",
      }));
      
      setAttractions(formattedResults);
      setSearchMode("tripadvisor");
      setLoading(false);
    } catch (err) {
      console.error("Erreur TripAdvisor:", err);
      setLoading(false);
    }
  };

  const sortByDistance = async () => {
    if (!filters.latitude || !filters.longitude) {
      alert("Veuillez entrer votre localisation");
      return;
    }

    setLoading(true);
    try {
      let url = `${API_URL}/attractions/by_distance/?latitude=${filters.latitude}&longitude=${filters.longitude}`;
      if (filters.radius) {
        url += `&radius=${filters.radius}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setAttractions(data.results || data);
      setDistanceSorted(true);
      setLoading(false);
    } catch (err) {
      console.error("Erreur tri par distance:", err);
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

  const handleTripAdvisorSearch = () => {
    setDistanceSorted(false);
    searchTripAdvisor();
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

  const isSaved = (attraction) => {
    return savedAttractions.some((a) => a.id === attraction.id);
  };

  const handleSave = (attraction) => {
    onSaveAttraction(attraction);
    calculateBudget(attractions);
  };

  return (
    <div className="search-page">
      <div className="filters-panel">
        <h2 className="filters-title">Filtres de recherche</h2>

        <div className="filter-group">
          <label>Source de recherche</label>
          <div className="search-mode-toggle">
            <button
              className={`mode-btn ${searchMode === "database" ? "active" : ""}`}
              onClick={() => setSearchMode("database")}
            >
              Base de données
            </button>
            <button
              className={`mode-btn ${searchMode === "tripadvisor" ? "active" : ""}`}
              onClick={() => setSearchMode("tripadvisor")}
            >
              TripAdvisor
            </button>
          </div>
        </div>

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

        {searchMode === "database" && (
          <>
            <div className="filter-group">
              <label>Catégorie</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="filter-select"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="filter-group">
              <label>Nombre minimum de photos</label>
              <input
                type="number"
                placeholder="Ex: 10"
                value={filters.min_photos}
                onChange={(e) => handleFilterChange("min_photos", e.target.value)}
                className="filter-input"
                min="0"
              />
            </div>

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
          </>
        )}

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
          {searchMode === "database" ? (
            <>
              <button className="btn-apply" onClick={handleSearch}>
                Appliquer filtres
              </button>
              <button className="btn-distance" onClick={sortByDistance}>
                📍 Trier par distance
              </button>
            </>
          ) : (
            <button className="btn-tripadvisor" onClick={handleTripAdvisorSearch}>
              🌍 Rechercher TripAdvisor
            </button>
          )}
          <button className="btn-reset" onClick={resetFilters}>
            Réinitialiser
          </button>
        </div>

        {/* Affichage du budget total */}
        {totalBudget > 0 && (
          <div className="budget-summary">
            <h3>💰 Budget de ma liste</h3>
            <p className="budget-amount">${totalBudget}</p>
          </div>
        )}
      </div>

      <div className="results-panel">
        <div className="results-header">
          <h2 className="results-title">
            {attractions.length} attraction{attractions.length > 1 ? "s" : ""}{" "}
            trouvée{attractions.length > 1 ? "s" : ""}
          </h2>
          {distanceSorted && (
            <span className="distance-label">📍 Triées par distance</span>
          )}
        </div>

        {loading ? (
          <div className="loading">⏳ Recherche en cours...</div>
        ) : attractions.length === 0 ? (
          <div className="no-results">
            <p>Aucune attraction trouvée. Essayez d'autres filtres.</p>
          </div>
        ) : (
          <div className="results-grid">
            {attractions.map((attraction, index) => (
              <div key={attraction.id} className="result-card">
                {/* Numérotation pour l'itinéraire */}
                {distanceSorted && (
                  <div className="route-number">{index + 1}</div>
                )}

                <div
                  className="result-image"
                  style={{
                    backgroundImage: `url(${
                      attraction.main_image ||
                      "https://via.placeholder.com/300x200"
                    })`,
                  }}
                >
                  <button
                    className={`save-badge ${isSaved(attraction) ? "saved" : ""}`}
                    onClick={() => handleSave(attraction)}
                    title={isSaved(attraction) ? "Retirer de ma liste" : "Ajouter à ma liste"}
                  >
                    {isSaved(attraction) ? "✅" : "💾"}
                  </button>
                </div>

                <div className="result-content">
                  <h3 className="result-title">{attraction.name}</h3>
                  
                  {attraction.category && (
                    <p className="result-category">
                      📂 {attraction.category}
                    </p>
                  )}
                  
                  {attraction.city && (
                    <p className="result-location">📍 {attraction.city}</p>
                  )}

                  {attraction.source !== "tripadvisor" && (
                    <div className="result-meta">
                      {attraction.tripadvisor_rating && (
                        <span className="result-rating">
                          ⭐ {attraction.tripadvisor_rating}
                        </span>
                      )}
                      {attraction.num_reviews && (
                        <span className="result-reviews">
                          💬 {attraction.num_reviews} avis
                        </span>
                      )}
                    </div>
                  )}

                  <div className="result-stats">
                    {attraction.num_likes !== undefined && (
                      <span className="stat-likes">
                        ❤️ {attraction.num_likes}
                      </span>
                    )}
                    {attraction.price_level && (
                      <span className="stat-price">
                        {"$".repeat(
                          typeof attraction.price_level === "string"
                            ? ["free", "budget", "moderate", "expensive", "luxury"].indexOf(
                                attraction.price_level
                              ) + 1
                            : attraction.price_level
                        )}
                      </span>
                    )}
                  </div>

                  {attraction.source !== "tripadvisor" && (
                    <button
                      className="btn-details"
                      onClick={() => onSelectAttraction(attraction.id)}
                    >
                      Voir détails
                    </button>
                  )}
                  
                  {attraction.source === "tripadvisor" && attraction.tripadvisor_url && (
                    <a
                      href={attraction.tripadvisor_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-details"
                    >
                      Voir sur TripAdvisor
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;