import React from "react";
import { useParams } from "react-router-dom";
import MealCalendar from "../components/MealCalendar";

export default function PlanPage() {
  const { id } = useParams();
  return <MealCalendar planId={id} />;
}
