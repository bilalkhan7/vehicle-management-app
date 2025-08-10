# Vehicle Management App

An **Angular 20** application for managing a list of vehicles.  
This project demonstrates integration with an **OpenAPI-based** REST API, modern Angular features such as **standalone components** and **signals**, and a responsive **Material 3 UI**.

---

## Features

- **Vehicles List**
  - Compact view showing: name, manufacturer, model, mileage
  - Alphabetical sorting (A→Z)
  - Empty state message
  - Click → navigate to details page
	

- **Vehicle Details Page**
  - Displays all available data for a selected vehicle

- **Add Vehicle Modal**
  - Validated form
  - Closes only on successful API response
  - Updates the list dynamically without refresh

- **Responsive UI**
  - Angular Material 3 theme
  - Mobile-friendly and accessible

---

## 🛠 Tech Stack

- **Angular 20** (standalone components, signals)
- **TypeScript**
- **Angular Material 3**
- **REST API** (OpenAPI schema-based)
- **Node.js / npm** for tooling

---

## Project Structure

```text
vehicle-management-app/
├── src/
│   ├── app/
│   │   ├── core/                   # Service & model
│   │   ├── shared/                 # Shared utilities/validators
│   │   │   └── validators
│   │   ├── features/               # Feature modules
│   │   │   └── vehicles/
│   │   │       ├── list/           # Vehicle list view
│   │   │       ├── detail/         # Vehicle details view
│   │   │       ├── add-vehicle/    # Add vehicle modal
│   │   │       └── delete-vehicle/ # Delete confirmation dialog
│   │   ├── app.routes.ts           # Application routing
│   │   ├── app.ts                  # Root component
│   │   └── app.config.ts           # Global providers
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
└── README.md

---

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bilalkhan7/vehicle-management-app.git
   cd vehicle-management-app

2. **Install dependencies**
```bash
npm install

3. **Run Locally**
```bash
npm start

4. **Build for production**
```bash
npm run build

---
## License
This project is licensed under the MIT License.