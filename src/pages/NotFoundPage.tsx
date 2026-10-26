import { Link } from "react-router-dom";

export default function NotFoundPage() {
    return (
        <section className="page">
            <div className="card empty-state">
                <h1>Página no encontrada</h1>
                <p className="page-subtitle">La página que buscas no existe.</p>
                <Link to="/catalog" className="btn btn-primary">Ir al catálogo</Link>
            </div>
        </section>
    );
}
