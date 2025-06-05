import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdClose } from "react-icons/md";
// useDebounce fonksiyonu: Bir değeri belirli bir süre geciktirerek günceller. 
// Böylece hızlı değişen inputlarda örneğin aramalarda performans iyileştirmesi sağlar.
function useDebounce(value, delay) {
  
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // delay süresi sonunda debouncedValue, value ile güncellenir
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    // cleanup: value veya delay değişirse önceki timeout iptal edilir
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;// Gecikmeli güncellenen değer döndürülür
}

function App() {
  // Karakterler listesini tutar
  const [characters, setCharacters] = useState([]);
  // API çağrılarında oluşan hataları tutar
  const [error, setError] = useState(null);
  // Sayfa numarası
  const [page, setPage] = useState(1);
  // API'den gelen sayfa bilgileri (toplam sayfa, vs)
  const [info, setInfo] = useState({});
  // Arama metni
  const [search, setSearch] = useState("");
  // Durum filtreleme (alive, dead, unknown)
  const [statusFilter, setStatusFilter] = useState("");
  // Tür filtreleme (species)
  const [speciesFilter, setSpeciesFilter] = useState("");
  // Sıralama düzeni (asc = artan, desc = azalan)
  const [sortOrder, setSortOrder] = useState("asc");
  // Sayfa başına gösterilecek karakter sayısı
  const [pageSize, setPageSize] = useState(10);
  // Detay için seçilen karakter
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  // Favori karakterleri localStorage'dan alır, yoksa boş dizi döner
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  // Favoriler değişince localStorage güncellenir
  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);
  // search state'ini 500ms gecikmeyle günceller (debounce)
  const debouncedSearch = useDebounce(search, 500);
  // API sayfasını hesaplama (API sayfaları 20 karakter içeriyor)
  const apiPage = Math.floor(((page - 1) * pageSize) / 20) + 1;
  // Bu sayfada gösterilecek karakterlerin başlangıç ve bitiş indexleri
  const startIndex = ((page - 1) * pageSize) % 20;
  const endIndex = startIndex + pageSize;

  useEffect(() => {
    // API URL'sini oluşturma ve filtreleri ekleme
    let url = `https://rickandmortyapi.com/api/character?page=${apiPage}`;
    if (debouncedSearch) url += `&name=${debouncedSearch}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (speciesFilter) url += `&species=${speciesFilter}`;

    setError(null);
    setSelectedCharacter(null);

    axios
      .get(url)
      .then((res) => {
        // API'den dönen sonuçlardan arama metniyle başlayan karakterleri filtreler
        const filteredResults = (res.data.results || []).filter((char) =>
          char.name.toLowerCase().startsWith(debouncedSearch.toLowerCase())
        );

        setCharacters(filteredResults); // Karakter listesini günceller
        setInfo(res.data.info || {});   // Sayfa bilgilerini günceller
      })
      .catch((err) => {
        // Hata durumlarında uygun mesajları ayarlar ve karakter listesini boşaltır
        if (err.response?.status === 404) {
          setError("Aradığınız kriterlere uygun karakter bulunamadı.");
        } else {
          setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        }
        setCharacters([]);
        setInfo({});
      });
  }, [apiPage, debouncedSearch, statusFilter, speciesFilter]);
  // Karakterleri ada göre sıralar (artarak veya azalarak)
  const sortedCharacters = [...characters].sort((a, b) => {
    if (sortOrder === "asc") return a.name.localeCompare(b.name);
    else return b.name.localeCompare(a.name);
  });
  // Sadece o sayfaya ait karakterleri gösterir
  const pagedCharacters = sortedCharacters.slice(startIndex, endIndex);
  // Toplam sayfa sayısını hesaplar
  const totalPages = info.pages ? Math.ceil((info.pages * 20) / pageSize) : 1;
  // Sayfa değiştirme fonksiyonları
  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNext = () => {
    if (page < totalPages) setPage(page + 1);
  };
  // Sayfa büyüklüğü veya filtre değişince sayfayı 1 yapar
  useEffect(() => {
    setPage(1);
  }, [pageSize, statusFilter, speciesFilter, debouncedSearch]);
  // Favorilere ekle / çıkar fonksiyonu
  const toggleFavorite = (char) => {
    setFavorites((prevFavorites) => {
      const isFav = prevFavorites.some((f) => f.id === char.id);
      if (isFav) {
        return prevFavorites.filter((f) => f.id !== char.id);
      } else {
        return [...prevFavorites, char];
      }
    });
  };
  // Bir karakter favorilerde mi kontrol eder
  const isFavorite = (char) => favorites.some((f) => f.id === char.id);

  // Stil objeleri
  const styles = {
    // Ana uygulama kapsayıcısı
    app: {
      backgroundColor: "#0b0c10",
      color: "#c5c6c7",
      minHeight: "100vh",
      padding: 20,
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      maxWidth: 900,
      margin: "auto",
    },
    // Başlık stili
    header: {
      color: "#66fcf1",
      textAlign: "center",
      marginBottom: 20,
      fontWeight: "bold",
      fontSize: 28,
      letterSpacing: 2,
      textShadow: "0 0 5px #45a29e",
    },
     // Filtre ve arama kontrollerinin kapsayıcısı
    controls: {
      marginBottom: 20,
      display: "flex",
      gap: 10,
      flexWrap: "wrap",
    },
    // Arama inputu stili
    input: {
    padding: 10,                     // İç boşluk: tüm kenarlardan 10 piksel boşluk bırakır
    flex: 1,                        // Flexbox'ta esneme katsayısı, diğer elemanlarla eşit şekilde genişler
    minWidth: 150,                  // Minimum genişlik: 150 piksel, daha küçük olmaz
    borderRadius: 6,                // Köşe yuvarlama: 6 piksel, kenarları hafif yuvarlatır
    border: "none",                 // Kenarlık yok, çerçevesiz görünüm sağlar
    outline: "none",                // Focus veya tıklama sırasında dış çizgi gösterilmez
    fontSize: 16,                   // Yazı boyutu: 16 piksel, okunabilir boyutta
    backgroundColor: "#1f2833",    // Arka plan rengi: koyu mavi-mavi tonları
    color: "#c5c6c7",              // Yazı rengi: açık gri tonlarında
    boxShadow: "0 0 5px #45a29e inset", // İç gölge efekti: mavi-yeşil tonlarında yumuşak iç ışık
    transition: "background-color 0.3s ease" // Arka plan renginin 0.3 saniyede yumuşak geçiş animasyonu
    },
    // Dropdown (select) elementlerinin stili
    select: {
      padding: 10,
      minWidth: 130,
      borderRadius: 6,
      fontSize: 16,
      backgroundColor: "#1f2833",
      color: "#c5c6c7",
      boxShadow: "0 0 5px #45a29e inset",
      cursor: "pointer",
    },
    // Tablo genel stili
    table: {
      width: "100%",
      borderCollapse: "collapse",
      marginBottom: 20,
      color: "#c5c6c7",
      boxShadow: "0 0 10px #45a29e",
      borderRadius: 8,
      overflow: "hidden",
    },
    // Tablo başlık hücrelerinin stili
    th: {
      borderBottom: "2px solid #45a29e",
      padding: 12,
      backgroundColor: "#1f2833",
      textAlign: "left",
      textShadow: "0 0 5px #66fcf1",
    },
    // Tablo veri hücrelerinin stili
    td: {
      borderBottom: "1px solid #323c45",
      padding: 12,
    },
    // Tablo satırı hover efekti ve tıklanabilirliği
    trHover: {
      cursor: "pointer",
      backgroundColor: "#16232f",
      transition: "background-color 0.3s ease",
    },
    // Seçili tablo satırı stili (örn. detayda vurgulama)
    trSelected: {
      backgroundColor: "#66fcf1",
      color: "#0b0c10",
      fontWeight: "bold",
      textShadow: "0 0 3px #45a29e",
    },
    // Sayfalama butonları ve sayfa numarasının kapsayıcısı
    pagination: {
      display: "flex",
      justifyContent: "center",
      gap: 10,
      marginBottom: 20,
    },
    // Sayfalama butonlarının normal stili
    button: {
      backgroundColor: "#45a29e",
      color: "#0b0c10",
      fontWeight: "bold",
      padding: "10px 20px",
      borderRadius: 6,
      cursor: "pointer",
      transition: "background-color 0.3s ease",
      boxShadow: "0 0 8px #45a29e",
    },
    // Sayfalama butonlarının devre dışı bırakılmış hali
    buttonDisabled: {
      backgroundColor: "#1f2833",
      color: "#4d565f",
      cursor: "not-allowed",
    },
    // Hata mesajı stili
    error: {
      color: "#ff4c4c",
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 20,
      textShadow: "0 0 5px #ff4c4c",
    },
    // Favori yıldız simgesinin stili
    favoriteStar: {
      cursor: "pointer",
      fontSize: 20,
      color: "#45a29e",
      transition: "color 0.3s ease",
    },
    // Aktif favori yıldızının parlak hali
    favoriteStarActive: {
      color: "#66fcf1",
      textShadow: "0 0 8px #66fcf1",
      animation: "pulse 1.5s infinite alternate",
    },
    // Favori karakterler listesi kapsayıcısı
    favoriteList: {
      marginTop: 20,
    },
    // Favori karakter listesinde her bir karakterin kapsayıcısı
    favoriteItem: {
      cursor: "pointer",
      marginBottom: 10,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: 6,
      borderRadius: 6,
      backgroundColor: "#1f2833",
      boxShadow: "0 0 5px #45a29e",
      transition: "background-color 0.3s ease",
    },
     // Favori öğe hover efekti (kullanılabilir ama şu an kullanılmıyor)
    favoriteItemHover: {
      backgroundColor: "#16232f",
    },
    // Favori karakter resminin stili
    favoriteImage: {
      width: 40,
      borderRadius: 6,
      boxShadow: "0 0 4px #66fcf1",
    },
    // Modal pencere için üst örtü (arka plan)
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(11, 12, 16, 0.85)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      zIndex: 9999,
    },
    // Modal pencere içeriğinin stili
    modalContent: {
      backgroundColor: "#1f2833",
      padding: 20,
      borderRadius: 10,
      width: "90%",
      maxWidth: 500,
      color: "#c5c6c7",
      boxShadow: "0 0 15px #45a29e",
      position: "relative",
    }, 
    // Modal kapatma butonunun stili (X işareti)
    modalClose: {
      position: "absolute",
      top: 10,
      right: 10,
      cursor: "pointer",
      color: "#66fcf1",
      fontSize: 28,
      transition: "color 0.3s ease",
    },
     // Modal içindeki karakter resminin stili
    modalImage: {
       width: "50%",
       borderRadius: 12,
       padding: 15,
       boxShadow: "0 0 10px #66fcf1", // Resim taşmasın, içinde kalsın
       
    },
     // Modal içindeki metinlerin stili
    modalText: {
      fontSize: 16,
      lineHeight: 1.4,
    },
  };

  return (
    <div style={styles.app}>
      <h1 style={styles.header}>Rick and Morty Karakterleri</h1>

      <div style={styles.controls}>
        <input
          style={styles.input}
          placeholder="İsim ile ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          spellCheck={false}
        />
        <select
          style={styles.select}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Durum (Tümü)</option>
          <option value="alive">Yaşayan</option>
          <option value="dead">Ölü</option>
          <option value="unknown">Bilinmeyen</option>
        </select>
        <select
          style={styles.select}
          value={speciesFilter}
          onChange={(e) => setSpeciesFilter(e.target.value)}
        >         
          <option value="">Tür (Tümü)</option>
          <option value="Human">İnsan</option>
          <option value="Alien">Uzaylı</option>
          <option value="Robot">Robot</option>
        </select>
        <select
          style={styles.select}
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="asc">Artan (A-Z)</option>
          <option value="desc">Azalan (Z-A)</option>
        </select>
        <select
          style={styles.select}
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={5}>Sayfa başına 5</option>
          <option value={10}>Sayfa başına 10</option>
          <option value={15}>Sayfa başına 15</option>
          <option value={20}>Sayfa başına 20</option>
        </select>
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {!error && (
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Favori</th>
              <th style={styles.th}>Resim</th>
              <th style={styles.th}>İsim</th>
              <th style={styles.th}>Tür</th>
              <th style={styles.th}>Durum</th>
            </tr>
          </thead>
          <tbody>
            {pagedCharacters.map((char) => (
              <tr
                key={char.id}
                style={styles.trHover}
                onClick={() => setSelectedCharacter(char)} // Satıra tıklanınca detay modalını aç
                title="Detaylar için tıklayın"
              >
                <td
                  onClick={(e) => {
                    e.stopPropagation();   // Satır tıklanmasının modali açmasını engelle
                    toggleFavorite(char);  // Favori ekle/çıkar fonksiyonu çağrılır
                  }}
                  style={{ textAlign: "center" }}
                >
                  <span
                    style={{
                      ...styles.favoriteStar,
                      ...(isFavorite(char) ? styles.favoriteStarActive : {}),
                    }}
                  >
                    ★
                  </span>
                </td>
                <td style={styles.td}>
                  <img
                    src={char.image}
                    alt={char.name}
                    width={50}
                    height={50}
                    style={{ borderRadius: 8 }}
                  />
                </td>
                <td style={styles.td}>{char.name}</td>
                <td style={styles.td}>{char.species}</td>
                <td style={styles.td}>{char.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={styles.pagination}>
        <button
          onClick={handlePrev} // Önceki sayfa fonksiyonu
          disabled={page === 1} // İlk sayfadaysa devre dışı
          style={page === 1 ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        >
          Önceki
        </button>
        <span style={{ alignSelf: "center", fontWeight: "bold" }}>
          {page} / {totalPages}
        </span>
        <button
          onClick={handleNext}
          disabled={page === totalPages}
          style={page === totalPages ? { ...styles.button, ...styles.buttonDisabled } : styles.button}
        >
          Sonraki
        </button>
      </div>

      {favorites.length > 0 && (
        <div style={styles.favoriteList}>
          <h3>Favori Karakterler</h3>
          {favorites.map((fav) => (
            <div
              key={fav.id}
              style={styles.favoriteItem}
              onClick={() => setSelectedCharacter(fav)}
              title="Detaylar için tıklayın"
            >
              <img
                src={fav.image}
                alt={fav.name}
                style={styles.favoriteImage}
              />
              <span>{fav.name}</span>
              <span
                onClick={(e) => {
                  e.stopPropagation();// Satır tıklanmasının modali açmasını engelle
                  toggleFavorite(fav);
                }}
                style={{ marginLeft: "auto", cursor: "pointer", color: "#ff5555" }}
                title="Favorilerden kaldır"
              >
                ✖
              </span>
            </div>
          ))}
        </div>
      )}

      {selectedCharacter && (
        <div
          style={styles.modalOverlay}
          onClick={() => setSelectedCharacter(null)}
        >
          <div
            style={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <MdClose
              style={styles.modalClose}
              onClick={() => setSelectedCharacter(null)}
              title="Kapat"
            />
            <img
              src={selectedCharacter.image}
              alt={selectedCharacter.name}
              style={styles.modalImage}
            />
            <div style={styles.modalText}>
              <h2>{selectedCharacter.name}</h2>
              <p><strong>Tür:</strong> {selectedCharacter.species}</p>
              <p><strong>Durum:</strong> {selectedCharacter.status}</p>
              <p><strong>Cinsiyet:</strong> {selectedCharacter.gender}</p>
              <p><strong>Orijin:</strong> {selectedCharacter.origin?.name}</p>
              <p><strong>Son Konum:</strong> {selectedCharacter.location?.name}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
