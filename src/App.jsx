import { Route, Routes } from "react-router-dom";
import CalculatorPage from "./ProductPage.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CalculatorPage />} />
    </Routes>
  );
}
