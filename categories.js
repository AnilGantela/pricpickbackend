export const ElectronicCategories = {
  "Mobile & Accessories": [
    "Smartphones",
    "Feature Phones",
    "Phone Cases & Covers",
    "Screen Protectors",
    "Chargers & Cables",
    "Power Banks",
    "Headphones & Earphones",
    "Smartwatches & Fitness Bands",
  ],
  "Computers & Laptops": [
    "Laptops",
    "Desktop Computers",
    "Monitors",
    "Keyboards & Mice",
    "External Hard Drives & SSDs",
    "Printers & Scanners",
    "Software & Operating Systems",
  ],
  "TV & Entertainment": [
    "Smart TVs",
    "LED / OLED / QLED TVs",
    "Streaming Devices",
    "Soundbars & Home Theaters",
    "Projectors",
    "Gaming Consoles",
  ],
  "Cameras & Photography": [
    "DSLR Cameras",
    "Mirrorless Cameras",
    "Action Cameras",
    "Drones",
    "Camera Lenses",
    "Tripods & Gimbals",
    "Memory Cards",
  ],
  "Home Appliances": [
    "Refrigerators",
    "Washing Machines",
    "Microwaves",
    "Air Conditioners",
    "Vacuum Cleaners",
    "Water Purifiers",
    "Electric Kettles",
  ],
  "Gaming & Accessories": [
    "Gaming Laptops",
    "Gaming Consoles",
    "Gaming Controllers",
    "Gaming Keyboards & Mice",
    "VR Headsets",
    "Graphics Cards",
  ],
  "Networking & Accessories": [
    "WiFi Routers",
    "Modems",
    "Network Switches",
    "Ethernet Cables",
    "WiFi Extenders",
  ],
  "Wearable Technology": ["Smartwatches", "Fitness Bands", "AR/VR Devices"],
  "Car Electronics": [
    "Car Stereos",
    "Dash Cameras",
    "GPS Navigation Devices",
    "Car Chargers",
    "Bluetooth Car Kits",
  ],
};

// Extract main categories
export const categoryValues = Object.keys(ElectronicCategories);

// Extract subcategories for validation
export const subcategoryValues = Object.values(ElectronicCategories).flat();
