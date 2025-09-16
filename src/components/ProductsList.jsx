import { useEffect, useMemo, useRef, useState } from "react";

/** ----------------------------------------------------------------
 * Product data (title, category, link, image)
 * You can extend this list anytime; the grid + filters will adapt.
 * ---------------------------------------------------------------- */
const PRODUCTS = [
  // Memory cards
  {
    title: "CFexpress™ v4 Type A",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/cfexpresstm-v4-type-a-72/",
    image:
      "https://www.angelbird.com/media/image/avp256cfxamk2_overview/20241105_Website_Overview_CFexpress-A-MK2_256GB_697x523.webp?v=2YrFukqV0f",
  },
  {
    title: "CFexpress™ 2.0 Type A",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/cfexpresstm-20-type-a-39/",
    image:
      "https://www.angelbird.com/media/image/avp160cfxase_overview/20241009_Website_Overview_CFexpress-A-SE_160GB_697x523.webp?v=2JcsVeV5Hp",
  },
  {
    title: "CFexpress™ v4 Type B",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/cfexpresstm-v4-type-b-76/",
    image:
      "https://www.angelbird.com/media/image/avp512cfxbsemk2_overview/20250121_Website_Overview_SE-CFexpress-B-MK2_512GB_697x523.webp?v=45vNbMV161",
  },
  {
    title: "CFexpress™ 2.0 Type B",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/cfexpresstm-20-type-b-37/",
    image:
      "https://www.angelbird.com/media/image/avp2t0cfxbmk2_overview/20240917_Website_Overview_CFexpress-B-MK2_2TB_697x523.webp?v=1hsOHolenn",
  },
  {
    title: "CFast™ 2.0",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/cfasttm-20-40/",
    image:
      "https://www.angelbird.com/media/image/avp256cfse_overview/20240917_Website_Overview_CF-CFast_256GB_697x523.webp?v=3uF5IxmLn8",
  },
  {
    title: "SDXC™ UHS-I / UHS-II",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/sdxctm-uhs-i-uhs-ii-38/",
    image:
      "https://www.angelbird.com/media/image/avp064sdmk2v90_overview/20240917_Website_Overview_SD-V90-MK2_64GB_697x523.webp?v=6JmNizEPCk",
  },
  {
    title: "microSDXC™ UHS-I / UHS-II",
    category: "Memory cards",
    link: "https://www.angelbird.com/category/microsdxctm-uhs-i-uhs-ii-41/",
    image:
      "https://www.angelbird.com/media/image/avp128msdv60_overview/20240917_Website_Overview_microSD-V60_128GB_697x523.webp?v=2KfeCNc6WW",
  },

  // Portable SSD & SSD lines
  {
    title: "Portable SSD",
    category: "Portable SSD",
    link: "https://www.angelbird.com/category/portable-ssd-74/",
    image:
      "https://www.angelbird.com/media/image/ssd2gopkt2t0mk3_overview/20250130_Website_Overview_SSD2GO-PKT-MK3_697x523.webp?v=4sv2kzo80x",
  },
  {
    title: "SSD2GO PKT",
    category: "Portable SSD",
    link: "https://www.angelbird.com/category/ssd2go-pkt-75/",
    image:
      "https://www.angelbird.com/media/image/ssd2gopkt2t0mk3_overview/20250130_Website_Overview_SSD2GO-PKT-MK3_697x523.webp?v=4sv2kzo80x",
  },
  {
    title: "Video & audio SSD",
    category: "Video & audio SSD",
    link: "https://www.angelbird.com/category/video-audio-ssd-33/",
    image:
      "https://www.angelbird.com/media/image/avp1000mk3_overview/20240917_Website_Overview_AV-PRO-MK3_697x523.webp?v=22FKjqC18W",
  },
  {
    title: 'AV PRO MK3 2.5"',
    category: "Video & audio SSD",
    link: "https://www.angelbird.com/category/av-pro-mk3-25-48/",
    image:
      "https://www.angelbird.com/media/image/avp1000mk3_overview/20240917_Website_Overview_AV-PRO-MK3_697x523.webp?v=22FKjqC18W",
  },

  // Readers
  {
    title: "Card Reader CFexpress A",
    category: "Memory card readers",
    link: "https://www.angelbird.com/category/card-reader-cfexpress-a-49/",
    image:
      "https://www.angelbird.com/media/image/card-reader-pkt-cfexpress-a_overview/20241205_Website_Overview_Card-Reader-PKT-CFexpress-A_697x523.webp?v=3N0AATQ8CY",
  },
  {
    title: "Card Reader CFexpress B",
    category: "Memory card readers",
    link: "https://www.angelbird.com/category/card-reader-cfexpress-b-50/",
    image:
      "https://www.angelbird.com/media/image/card-reader-pkt-cfexpressb_overview/20241205_Website_Overview_Card-Reader-PKT-CFexpress-B_697x523.webp?v=2KYghJeXQs",
  },
  {
    title: "Card Reader SD",
    category: "Memory card readers",
    link: "https://www.angelbird.com/category/card-reader-sd-52/",
    image:
      "https://www.angelbird.com/media/image/card-reader-pkt-sd_overview/20241205_Website_Overview_Card-Reader-PKT-SD_697x523.webp?v=3NMKro4xSP",
  },
  {
    title: "Card Reader CFast 2.0",
    category: "Memory card readers",
    link: "https://www.angelbird.com/category/cfast-20-card-reader-2774/",
    image:
      "https://www.angelbird.com/media/image/cfs31pk_overview/20240917_Website_Overview_CFast-2.0-Card-Reader_697x523.webp?v=7hcjGJ5qOp",
  },

  // Accessories
  {
    title: "Mounting Bracket PKT",
    category: "Accessories",
    link: "https://www.angelbird.com/category/mounting-bracket-pkt-73/",
    image:
      "https://www.angelbird.com/media/image/pktmb1_overview/20250226_Website_Overview_Mounting-Bracket-PKT_697x523.webp?v=3f8WHtxp4z",
  },
  {
    title: "Tech Pouch",
    category: "Accessories",
    link: "https://www.angelbird.com/category/tech-pouch-71/",
    image:
      "https://www.angelbird.com/media/image/tech-pouch-gopd_overview/20241009_Website_Overview_Tech-Pouch_697x523.webp?v=3NRVoiNpbB",
  },
  {
    title: "Media Tank™",
    category: "Accessories",
    link: "https://www.angelbird.com/category/media-tank-54/",
    image:
      "https://www.angelbird.com/media/image/media-tank-ca2_overview/20241128_Website_Overview_Media-Tank_CFexpress-A_697x523.webp?v=5Xz0NR8u0Z",
  },

  // Cables & Adapters
  {
    title: "USB-A-to-C Adapter",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-a-to-c-adapter-57/",
    image:
      "https://www.angelbird.com/media/image/usb-a-c_overview/20240917_Website_Overview_USB-A-to-C-Adapter_697x523.webp?v=1J5bLyZWay",
  },
  {
    title: "USB-C-to-SATA Adapter",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-c-to-sata-adapter-58/",
    image:
      "https://www.angelbird.com/media/image/c-sata_overview/20240917_Website_Overview_USB-C-To-SATA-Adapter_697x523.webp?v=3a0GQ64Mkg",
  },
  {
    title: "USB-C 4.0 Cable",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-c-40-cable-115/",
    image:
      "https://www.angelbird.com/media/image/usb-c-to-c-40-solid-flex-cable_lime_overview/20250623_Website_Overview_USB-C-to-C-4.0-Solid-Flex-Cable_Lime_697x523.webp?v=7I6LI79rNH",
  },
  {
    title: "USB-C 3.2 Tether Cable",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-c-32-tether-cable-114/",
    image:
      "https://www.angelbird.com/media/image/usb-c-to-c-32-solid-flex-tether-cable_overview/20250623_Website_Overview_USB-C-to-C-3.2-Solid-Flex-Tether-Cable_697x523.webp?v=55HIvsX9QS",
  },
  {
    title: "USB-C 3.2 Cable",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-c-32-cable-112/",
    image:
      "https://www.angelbird.com/media/image/usb32cc050_overview/20240917_Website_Overview_USB-C-3.2-Cable_697x523.webp?v=2AAgs9Rgii",
  },
  {
    title: "USB-A-to-C 3.2 Cable",
    category: "USB & adapters",
    link: "https://www.angelbird.com/category/usb-a-to-c-32-cable-113/",
    image:
      "https://www.angelbird.com/media/image/usb-a-to-c-32-solid-flex-cable_overview/20250623_Website_Overview_USB-A-to-C-3.2-Solid-Flex-Cable_697x523.webp?v=57A7sDWjuf",
  },

  // Brand / Ecosystem
  {
    title: "ARRI",
    category: "Ecosystem",
    link: "https://www.angelbird.com/category/arri-45/",
    image:
      "https://www.angelbird.com/media/image/avp256cfar_overview/20240917_Website_Overview_AV-PRO-AR-256_256GB_697x523.webp?v=DOjFfYtjie",
  },
  {
    title: "Atomos",
    category: "Ecosystem",
    link: "https://www.angelbird.com/category/atomos-46/",
    image:
      "https://www.angelbird.com/media/image/atomxssdmini_overview/20240917_Website_Overview_AtomX-SSDmini_697x523.webp?v=3tzjBQtKfI",
  },
  {
    title: "Kondor Blue",
    category: "Ecosystem",
    link: "https://www.angelbird.com/category/kondor-blue-61/",
    image:
      "https://www.angelbird.com/media/image/kbrmcfxb_overview/20240917_Website_Overview_Kondor-Blue-CFexpress-B-Recording-Module_Space-Gray_697x523.webp?v=7MIWrGEyKI",
  },
  {
    title: "RED",
    category: "Ecosystem",
    link: "https://www.angelbird.com/category/red-44/",
    image:
      "https://www.angelbird.com/media/image/redcfastcr_overview/20240917_Website_Overview_RED-CFast-Card-Reader_697x523.webp?v=104mc4sTw1",
  },

  // Custom / Refurbished
  {
    title: "Custom media",
    category: "Custom",
    link: "https://www.angelbird.com/category/custom-media-31/",
    image:
      "https://www.angelbird.com/media/image/collective_yuri-beletsky_banner_01/20250724_Website_Collective_Banner_Yuri-Beletsky_01_1510x1130_Extended.webp",
  },
  {
    title: "Refurbished offers",
    category: "Certified refurbished",
    link: "https://www.angelbird.com/refurbished/",
    image:
      "https://www.angelbird.com/media/image/discover_dealszone-teaser_banner_01/20250611_Website_Discover_Banner_Deals-Zone-Teaser_01_1510x1130.webp",
  },
];

/** Unique, sorted category list for the dropdown */
const CATEGORIES = ["All categories", ...Array.from(new Set(PRODUCTS.map(p => p.category))).sort()];

/** Card component */
function Card({ item }) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition"
    >
      <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100">
        <img
          src={item.image}
          alt={item.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
        <p className="mt-1 text-xs text-gray-500">{item.category}</p>
      </div>
    </a>
  );
}

export default function ProductCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All categories");
  const [visible, setVisible] = useState(9); // initial items
  const gridRef = useRef(null);
  const sentinelRef = useRef(null);

  // Filter logic
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PRODUCTS.filter((p) => {
      const inCategory = category === "All categories" || p.category === category;
      const inQuery = !q || p.title.toLowerCase().includes(q);
      return inCategory && inQuery;
    });
  }, [query, category]);

  const itemsToShow = useMemo(() => filtered.slice(0, visible), [filtered, visible]);

  // Reset paging when filters change
  useEffect(() => {
    setVisible(9);
    // scroll to top of grid when new filter applied
    gridRef.current?.scrollTo?.({ top: 0, behavior: "smooth" });
  }, [query, category]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && itemsToShow.length < filtered.length) {
          setVisible((v) => v + 9);
        }
      },
      { root: null, threshold: 1.0 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [itemsToShow.length, filtered.length]);

  const clear = () => {
    setQuery("");
    setCategory("All categories");
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Search</label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
          />
        </div>

        <div className="sm:w-64">
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-200"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={clear}
          className="h-10 rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-800"
        >
          Clear
        </button>
      </div>

      {/* Grid */}
      <div ref={gridRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {itemsToShow.map((item) => (
          <Card key={item.title} item={item} />
        ))}
      </div>

      {/* Sentinel / Empty state */}
      <div ref={sentinelRef} className="py-4 text-center text-sm text-gray-500">
        {itemsToShow.length === 0
          ? "No products match your filters."
          : itemsToShow.length < filtered.length
          ? "Loading more…"
          : "All products loaded."}
      </div>
    </div>
  );
}
