import ExamRunner from "@/components/exam/ExamRunner";
import { examenDemo } from "@/lib/demo-data";

export default function PaginaExamenDemo() {
  return <ExamRunner examen={examenDemo} />;
}
