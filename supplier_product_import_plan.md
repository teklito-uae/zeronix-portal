# Plan: Multi-Category Bulk Supplier Import System

This document outlines a robust system for importing diverse product lists (Laptops, Storage, Surveillance, etc.) with inconsistent structures and frequent price updates.

## 1. Data Strategy & Category Engine

### The Challenge
- **Diverse Categories**: Laptops have CPUs/RAM; Surveillance has Channels/Resolution; Storage has TB/NAS bays.
- **Missing Model Codes**: Some products only have names without unique part numbers.
- **Intel Core Ultra**: New naming (U5, U7, U9) needs to be captured.

### The Solution: Keyword-Driven Classification
We will use a **Weighted Keyword Engine** to guess the category and extract relevant attributes.

| Category | Detection Keywords | Extraction Keys |
|---|---|---|
| **Laptops** | Core, Ryzen, RTX, i5, U7, 15.6", FHD | CPU, RAM, SSD, GPU, Screen |
| **Storage (NAS)** | Synology, QNAP, DiskStation, Bay | Bays, Processor, RAM |
| **Storage (Drives)**| HDD, SSD, NVMe, WD, Seagate, IronWolf | Capacity (GB/TB), Speed, Type |
| **Surveillance** | Hikvision, Dahua, 4MP, 8ch, NVR, DVR | Resolution, Channels, Technology |
| **Monitors** | Monitor, Hz, IPS, Curved, 27", 32" | Size, Refresh Rate, Panel Type |

---

## 2. Database Schema (Additions)

### `supplier_products`
- `id`: Primary Key
- `supplier_id`: Foreign Key
- `category_id`: Foreign Key (Auto-detected or Manually assigned)
- `product_id`: Foreign Key (Nullable link to master products)
- `raw_text`: Text (The full original line)
- `identifier_hash`: String (Unique hash of normalized raw text - for items without model codes)
- `model_code`: String (Nullable - e.g., `83EM003RPS`)
- `name`: String (Parsed display name)
- `price`: Decimal(12, 2)
- `currency`: String (AED)
- `specs`: JSONB (Dynamic attributes based on category)
- `last_pasted_at`: Timestamp

### `category_rules`
- `id`, `category_id`, `keywords` (JSON array of strings used for auto-detection)

---

## 3. The Implementation Flow

### Step 1: Bulk Input
- **Module**: `SupplierBulkImport.tsx`
- **Options**: 
  - Dropdown: Select Supplier.
  - Optional: "Set Global Category" (Force all items to a specific category).
  - Textarea: Paste data.

### Step 2: Intelligent Parsing Logic
The parser will process each line through these steps:
1.  **Data Sanitization**: Strip emojis (e.g., `▪️`, `✅`) and non-standard bullet points from each line.
2.  **Price & Attribute Split**: 
    - Locate the `=` or `:` separator to isolate the price.
    - If a line uses `|`, treat it as an attribute-heavy broadcast and split the remaining text by `|` to extract specs.
3.  **Category Detection**: Match words against `category_rules`.
3.  **Attribute Extraction**:
    - **Laptops**: 
      - Support for `Core Ultra 5/7/9` (U5/U7/U9).
      - Fuzzy matching for `Cori9`, `Cori7`, `Cori5` -> Map to `Core i9`, `Core i7`, etc.
      - Advanced AMD support: `Ryzen 9 8940HX`, `Ryzen 9-9955HX`, etc.
      - Support for **Professional GPUs** (e.g., `RTX 2000 Ada`, `RTX 5000 Ada`) and `vPro` tags.
    - **Storage**: Detect `TB` vs `GB`.
    - **Surveillance**: Detect `ch` (channels) and `MP` (megapixels).
4.  **Identity Creation**:
    - **Advanced Model Detection**: Search for pattern codes between Brand and Processor (e.g., `G815JPR-IS96`, `FA608UP-A16.R95070`).
    - If **NOT FOUND**: Generate an `identifier_hash` from the brand + name + specs to track it uniquely.

### Step 3: Interactive Preview Table
A smart table allows the admin to:
- **Manual Price Entry**: If no price was found on the line, the cell is highlighted in RED and admin can type the price directly.
- **Change Category**: Dropdown for each row if auto-detect was wrong.
- **Fix Data**: Edit the name or model code inline (e.g., fixing `1 6"` to `16"`).
- **Fuzzy Correction**: System suggests "Did you mean Core i9?" for `Cori9`.
- **Match Status**:
  - 🟦 **New Product**: First time seeing this hash/code.
  - 🟨 **Existing (Updated)**: Found in DB, price has changed.
  - 🟩 **Existing (No Change)**: Found in DB, price is the same.

### Step 4: Finalization
- **Backend Upsert**: 
  - Matches by `model_code` FIRST.
  - Matches by `identifier_hash` SECOND (for items without codes).
- **Price Logging**: Updates current price and saves history.

---

## 4. Specific keyword groups to support

### Processors (Intel Core Ultra +)
- `Core Ultra 5`, `Core Ultra 7`, `Core Ultra 9`
- `U5`, `U7`, `U9`
- `i3`, `i5`, `i7`, `i9` (12th Gen, 13th Gen, 14th Gen)

### Storage/NAS
- `1TB`, `2TB`, `4TB`, `8TB`, `10TB`, `12TB`, `16TB`, `18TB`, `20TB`, `22TB`
- `NAS`, `SATA`, `SAS`, `Enterprise`, `Surveillance Drive`

### Surveillance
- `4 Channel`, `8 Channel`, `16 Channel`, `32 Channel`
- `2MP`, `4MP`, `5MP`, `8MP`, `4K`
- `IP Camera`, `Analog`, `NVR`, `DVR`
