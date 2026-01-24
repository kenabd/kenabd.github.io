import { Route, Routes } from "react-router-dom";
import LandingPage from "./LandingPage.jsx";
import ProductPage from "./ProductPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/products" element={<ProductPage />} />
    </Routes>
  );
}
