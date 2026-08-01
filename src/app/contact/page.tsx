import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact Us - Mimi Mail",
  description: "Send us your questions, concerns, suggestions, or reviews.",
};

export default function ContactPage() {
  return <ContactClient />;
}
