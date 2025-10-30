export class LocalNlpAssistantService {
  async reply(
    conversation: Array<{ role: 'user' | 'assistant'; content: string }>,
  ): Promise<string> {
    const last = conversation.slice(-1)[0];
    const q = (last?.content ?? '').toLowerCase();

    // Intentos principales (español)
    if (/^(buscar|encontrar)\s+libro/.test(q) || /codigo\b/.test(q)) {
      return 'Para buscar un libro por código: usa el buscador de la página principal, elige el prefijo (por ejemplo ES) y escribe el identificador numérico. Te mostraré piso, sección y estante. ¿Quieres que te guíe paso a paso?';
    }

    if (/horarios|apertura|cierre|servicios\s+disponibles/.test(q)) {
      return 'Horarios y servicios: la biblioteca abre de lunes a viernes. Ofrecemos préstamo y renovación, reservas de espacios, acceso a colecciones digitales y talleres. Para información exacta, consulta el módulo “Servicios”. ¿Qué servicio te interesa?';
    }

    if (/pol[ií]ticas|normas|reglas|prestamo/.test(q)) {
      return 'Políticas de préstamo: presenta credencial vigente, respeta tiempos de préstamo y renovaciones sujetas a disponibilidad. Las multas aplican desde el cuarto día de atraso. ¿Necesitas ayuda con un caso específico?';
    }

    if (/colecciones\s+digitales|acceso\s+digital|bases\s+de\s+datos/.test(q)) {
      return 'Acceso a colecciones digitales: ingresa con tu cuenta institucional y navega por bases de datos y repositorios. Si no puedes acceder, verifica tu contraseña o contacta soporte. ¿Qué recurso buscas?';
    }

    if (/contact(ar)?\s+al?\s+personal|ayuda\s+humana|soporte/.test(q)) {
      return 'Puedes contactar al personal en el mostrador de entrada o por correo: biblioteca@instituto.edu. Indica tu necesidad y código del material si aplica. ¿Deseas que redacte el mensaje?';
    }

    // Técnicas o administrativas
    if (/iniciar\s+sesion|login|autenticaci[oó]n/.test(q)) {
      return 'Para iniciar sesión: en el encabezado selecciona “Iniciar sesión” y usa tu cuenta institucional. Si olvidaste la contraseña, usa la opción de recuperación.';
    }

    if (/admin|panel\s+de\s+administraci[oó]n|rangos|configuraci[oó]n/.test(q)) {
      return 'La sección de administración está disponible para personal autorizado. Desde allí se gestionan rangos de clasificación, usuarios y ajustes. ¿Buscas una guía específica?';
    }

    // Fallback general con guía
    return 'No estoy seguro de haber comprendido tu consulta. Puedes reformularla o elegir una opción: “Buscar libro por código”, “Horarios y servicios disponibles”, “Políticas de préstamo”, “Acceso a colecciones digitales” o “Contactar al personal”.';
  }
}

export const localNlpAssistantService = new LocalNlpAssistantService();