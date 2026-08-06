import { Examen } from "@/types/exam";

export const examenDemo: Examen = {
  id: "demo-1",
  titulo: "Los Sacramentos de la Iniciación",
  descripcion: "Un repaso alegre sobre el Bautismo, la Eucaristía y la Confirmación.",
  imagenPortadaUrl:
    "https://images.unsplash.com/photo-1438032005730-c779502df39b?q=80&w=1200&auto=format&fit=crop",
  tiempoMaximoMin: 20,
  preguntas: [
    {
      id: "p1",
      tipo: "RESPUESTA_UNICA",
      enunciado: "¿Cuál es el primer sacramento que recibimos?",
      opciones: [
        { id: "p1o1", texto: "El Bautismo" },
        { id: "p1o2", texto: "La Confirmación" },
        { id: "p1o3", texto: "La Eucaristía" },
        { id: "p1o4", texto: "La Reconciliación" },
      ],
      retroalimentacion: "¡Correcto! El Bautismo nos hace hijos de Dios y miembros de la Iglesia.",
    },
    {
      id: "p2",
      tipo: "VERDADERO_FALSO",
      enunciado: "La Biblia está compuesta por el Antiguo y el Nuevo Testamento.",
      opciones: [
        { id: "v", texto: "Verdadero" },
        { id: "f", texto: "Falso" },
      ],
    },
    {
      id: "p3",
      tipo: "SELECCION_MULTIPLE",
      enunciado: "¿Cuáles de estos son frutos del Espíritu Santo? (elige todas las que apliquen)",
      opciones: [
        { id: "p3o1", texto: "Amor" },
        { id: "p3o2", texto: "Paciencia" },
        { id: "p3o3", texto: "Envidia" },
        { id: "p3o4", texto: "Alegría" },
      ],
    },
    {
      id: "p4",
      tipo: "IMAGEN_RESPUESTA",
      enunciado: "¿Qué objeto usa el sacerdote para bendecir con agua bendita?",
      opciones: [
        {
          id: "p4o1",
          imagenUrl:
            "https://images.unsplash.com/photo-1601987078451-1731e3120720?q=80&w=400&auto=format&fit=crop",
          texto: "Hisopo",
        },
        {
          id: "p4o2",
          imagenUrl:
            "https://images.unsplash.com/photo-1518998053901-5348d3961a04?q=80&w=400&auto=format&fit=crop",
          texto: "Cáliz",
        },
        {
          id: "p4o3",
          imagenUrl:
            "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?q=80&w=400&auto=format&fit=crop",
          texto: "Vela",
        },
      ],
    },
    {
      id: "p5",
      tipo: "ORDENAR_ELEMENTOS",
      enunciado: "Ordena los sacramentos de la iniciación cristiana en el orden correcto.",
      opciones: [
        { id: "p5o1", texto: "Confirmación" },
        { id: "p5o2", texto: "Bautismo" },
        { id: "p5o3", texto: "Eucaristía" },
      ],
    },
  ],
};
