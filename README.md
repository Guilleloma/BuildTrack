# BuildTrack
Control de Reformas

BuildTrack - Plataforma de Gestión de Reformas
El Problema
Las reformas y construcciones suelen ser procesos complejos, con múltiples partidas, pagos escalonados y riesgos de desviaciones en el presupuesto. La falta de una herramienta estructurada genera problemas como:

Falta de transparencia: Los clientes no tienen visibilidad clara del progreso y costos reales.
Desviaciones presupuestarias no controladas: Cambios imprevistos elevan los costos sin un seguimiento adecuado.
Pagos desorganizados: No existe un método claro para liberar pagos en función del avance real.
Falta de documentación: No hay un sistema estandarizado para validar materiales, avances y justificaciones de costos.
Confianza deteriorada: La falta de control genera desconfianza entre clientes y profesionales.
La Solución: BuildTrack
BuildTrack es una plataforma que permite gestionar reformas de manera estructurada y transparente, asegurando un control detallado de avances, pagos y desviaciones de presupuesto. Facilita la comunicación entre clientes y profesionales, permitiendo un seguimiento preciso del proyecto en tiempo real.

Tecnologías Utilizadas
Frontend: React/React Native o Flutter
Backend: Node.js con Express o Django
Base de Datos: PostgreSQL o MongoDB
Autenticación: Firebase Auth o Auth0
Pago: Stripe o PayPal
Funcionalidades Clave
Registro y Autenticación: Creación de cuentas para clientes y profesionales.
Creación de Proyectos: Definición de reformas con detalles, fases y pagos acordados.
Gestión de Tareas/Hitos: División del proyecto en tareas con porcentaje de completitud y validación.
Sistema de Pagos: Métodos escalonados como 50%-50%, 30-30-40, y pagos por hitos.
Validación y Documentación: Subida de fotos y recibos, validación de materiales y avances.
Panel de Control: Seguimiento en tiempo real del progreso, pagos y documentación.
Feedback y Reseñas: Sistema de calificaciones y reseñas para generar confianza.
Seguimiento de Desvíos de Presupuesto
Cada partida tendrá un presupuesto inicial asignado.
Se registrarán desvíos cuando haya diferencias entre el presupuesto estimado y el gasto real.
Se indicará la razón del desvío (imprevistos, cambios en materiales, costos extra de mano de obra).
Se calculará el porcentaje de desviación en cada partida.
Un panel mostrará en tiempo real:
Presupuesto inicial vs. Gastos actuales
Diferencia absoluta (€) y porcentaje de desviación (%)
Al finalizar, se generará un informe de costos con:
Presupuesto inicial total.
Gasto real total.
Total de desvío en euros y porcentaje.
Posibilidad de exportar un informe en PDF o Excel.
Cómo Empezar
Clonar el repositorio.
Configurar las variables de entorno para la base de datos y autenticación.
Ejecutar el servidor y la aplicación.

