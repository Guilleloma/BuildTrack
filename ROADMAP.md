# Roadmap - BuildTrack Project

Este documento describe el plan de desarrollo incremental del proyecto BuildTrack siguiendo una metodología Agile, permitiéndote aprender y adaptar cada tecnología paso a paso.

## Sprint 0: Setup Inicial
- Crear el repositorio y la estructura de carpetas (por ejemplo, directorios `backend` y `frontend`).
- Decidir las tecnologías: se sugiere usar Node.js con Express para el backend y React para el frontend, con PostgreSQL (u otra base de datos) para la persistencia de datos.
- Configurar el entorno de desarrollo e instalar dependencias básicas.
- Realizar un commit inicial con la estructura básica del proyecto.

+ Validación:
+ - El backend se validó ejecutando `npm start` en el directorio "backend" y comprobando, mediante `curl http://localhost:3000`, que se mostró el mensaje "Hello from BuildTrack backend!".
+ - El frontend se validó ejecutando `npm start` en el directorio "frontend" (en puerto 3001), verificando la compilación exitosa y la carga de la página por defecto.
+
+ Estado: COMPLETADO

## Sprint 1: Funcionalidad Básica de Autenticación
- Implementar el registro y login de usuarios (puedes probar algo sencillo usando JWT o Passport).
- Crear endpoints en el backend para manejar la autenticación y formularios básicos en el frontend.
- Documentar el proceso y realizar pruebas iniciales.

+ Validación:
+ - Se implementaron endpoints de registro e inicio de sesión en el backend utilizando JWT.
+ - Se realizaron pruebas utilizando curl desde la terminal y mediante la interfaz del frontend.
+ - Se verificó que el registro devolviera un token JWT y que el login funcionara correctamente.
+ - Se instaló y configuró CORS para permitir peticiones desde el frontend (que corre en el puerto 3001).
+ - Se reiniciaron todos los procesos para asegurar un entorno limpio.
+
+ Estado: COMPLETADO

## Sprint 2: Gestión de Proyectos
- Desarrollar una API CRUD para proyectos, permitiendo a los usuarios crear, leer, actualizar y eliminar proyectos.
- Diseñar formularios e interfaces en el frontend para gestionar estos proyectos.
- Validar y probar la integración entre frontend y backend.

+ **Criterios de Aceptación y Test:**
+ - La API debe permitir crear, leer, actualizar y eliminar proyectos.
+ - Se deben poder enviar peticiones de prueba (por ejemplo, usando Postman o cURL) y recibir respuestas correctas.
+ - El frontend debe reflejar en tiempo real los cambios (creación, edición y eliminación) sin errores.
+ - Se implementarán tests unitarios y de integración para comprobar al menos el 70% de cobertura en esta funcionalidad.
+
+ **Validación y Resultados:**
+ - Se validaron los endpoints CRUD con pruebas manuales usando curl:
+     * GET /projects devolvió un arreglo inicialmente vacío.
+     * POST /projects devolvió el objeto creado con un ID asignado.
+     * GET /projects/1 permitió recuperar el proyecto creado.
+     * PUT /projects/1 actualizó correctamente el proyecto.
+     * DELETE /projects/1 eliminó el proyecto devolviendo confirmación.
+ - La funcionalidad fue verificada en el frontend mediante la creación, edición y eliminación de proyectos, observando actualizaciones en tiempo real.
+ - Resultado: Los tests manuales confirman el correcto funcionamiento de la API y la interfaz de usuario.
+ **Estado: COMPLETADO**
+ Nota: Actualmente, los proyectos no están asociados a un usuario. Se planifica agregar esta funcionalidad en el Sprint 7 (Mejoras, Pruebas y Despliegue), aprovechando la autenticación implementada en el Sprint 1.

## Sprint 3: Gestión de Hitos y Tareas
- Añadir funcionalidad para agregar tareas y hitos dentro de cada proyecto.
- Asociar cada tarea/hito a un proyecto y definir estados de completado.
- Actualizar la interfaz de usuario para reflejar la estructura de tareas/hitos.
+ Añadir funcionalidad para agregar hitos dentro de cada proyecto, de manera que cada hito contenga sus propias tareas.
+ Asociar cada hito a un proyecto y, dentro de cada hito, permitir la gestión de tareas (crear, actualizar y eliminar).
+ Actualizar la interfaz de usuario para reflejar la jerarquía: Proyectos > Hitos > Tareas.

+ **Criterios de Aceptación y Test:**
+ - La API debe permitir crear, actualizar y eliminar hitos.
+ - Dentro de cada hito, se deben poder gestionar (crear, actualizar y eliminar) tareas.
+ - La interfaz debe reflejar la jerarquía, mostrando para cada proyecto sus hitos y, para cada hito, sus tareas con su estado (completado o pendiente).
+ - Se incluirán tests unitarios para la lógica de manejo de hitos y tareas.
  
+ **Validación y Resultados:**
+ - Se validaron los endpoints para la gestión de hitos y tareas mediante pruebas manuales con curl, comprobando la correcta creación, edición y eliminación de hitos y tareas.
+ - La funcionalidad fue verificada en el frontend, donde se confirmó que cada hito muestra sus tareas correspondientes y que se pueden agregar, editar y eliminar.
+ **Estado: COMPLETADO**

## Sprint 4: Sistema de Pagos / Payment Processing
- Implemented a new payment processing endpoint (POST /payments) that validates the required fields: projectId, milestoneId, and amount.
- The endpoint returns a nested JSON structure containing both the processed payment and the updated milestone details.
- On processing a payment, the milestone's 'paidAmount' is increased and 'pendingAmount' is updated accordingly.
- Integrated the payment processing logic into the frontend's Payments component for real-time user interaction.
- Basic error handling implemented for invalid inputs and non-existent project or milestone.

 **Estado: COMPLETADO**

## Sprint 5: Optimización para Testeo y Actualización Automática
- Implementar polling en el frontend para actualizar automáticamente la lista de proyectos (por ejemplo, en la sección Payments) sin necesidad de hacer refresh manual.
- Agregar zona de depuración en el frontend para mostrar mensajes y logs de las acciones realizadas (por ejemplo, se mostrará la cantidad de proyectos obtenidos y otros eventos del UI).
- Optimizar la interacción entre frontend y backend para facilitar la depuración y pruebas en entornos de desarrollo.

+ Validación:
+ - Se verificó que el frontend se actualice automáticamente y se muestre el área de Debug Log con los mensajes pertinentes.
**Estado: COMPLETADO**

## Sprint 6: Capa Gráfica e Integración Visual (Dividido en Hitos)
### Hito 6.1: Diseño y Estructura Base de la UI
- Implementar la estructura mínima con un header, un menú lateral y un área principal para contenidos.
- Configurar rutas y navegación básica utilizando Material UI para garantizar un diseño limpio y responsive.
+ Validación:
+ - Se verificará que el layout se visualice correctamente en diferentes dispositivos y resoluciones.
**Estado: COMPLETADO**

### Hito 6.2: Listado de Proyectos y Vistas Detalladas
- Implementar una vista de listado de proyectos en formato de tarjetas o tablas, permitiendo filtros y búsquedas.
- Crear vistas detalladas para cada proyecto, mostrando hitos, tareas y validaciones.
+ Validación:
+ - Confirmar que la navegación sea intuitiva y la información se presente de forma clara en cada proyecto.
**Estado: COMPLETADO**

## Sprint 7: Implementar pagos de milestones
- Implementar la lógica para el pago de milestones, permitiendo registrar pagos y actualizar el estado de los milestones y las cantidades pagadas y pendientes.
- Desarrollar una interfaz de usuario intuitiva para la gestión de pagos.
- Implementar un sistema de seguimiento del estado de pagos (UNPAID, PARTIALLY_PAID, PAID).
- Crear un historial de pagos con detalles completos de cada transacción.

**Criterios de Aceptación:**
- Los usuarios deben poder realizar pagos parciales o totales para cada milestone.
- El sistema debe validar que los pagos no excedan el costo total del milestone.
- El estado del milestone debe actualizarse automáticamente según los pagos (UNPAID, PARTIALLY_PAID, PAID).
- El historial de pagos debe mostrar fecha, monto, descripción y estado de cada pago.
- La interfaz debe mostrar claramente el monto total, pagado y pendiente de cada milestone.
- El botón de pago debe deshabilitarse cuando el milestone esté completamente pagado.
- Los pagos deben reflejarse en tiempo real sin necesidad de refrescar la página.

**Validación y Resultados:**
- Se implementó exitosamente el endpoint POST /payments para procesar pagos.
- Se creó el endpoint GET /payments/milestone/:id para obtener el historial de pagos.
- Se desarrolló una interfaz de usuario con:
  * Formulario modal para realizar pagos con validación de montos.
  * Visualización de estados mediante chips de colores (verde para pagado, amarillo para parcial).
  * Tabla de historial de pagos con actualización en tiempo real.
  * Indicadores visuales del progreso de pago en cada milestone.
- Se realizaron pruebas exitosas de:
  * Pagos parciales y totales
  * Validación de montos máximos
  * Actualización automática del estado del milestone
  * Actualización en tiempo real del historial de pagos
  * Deshabilitación del botón de pago en milestones pagados

**Estado: COMPLETADO**

## Sprint 8: Pagina Payments
- Implementación de una página de pagos con visión global y por proyecto
- Desarrollo de estadísticas generales (total pagado, número de pagos, promedio)
- Vista detallada de pagos por proyecto con sistema de acordeón
- Historial de pagos con capacidad de búsqueda y filtrado
- Visualización del progreso de pagos con barras de progreso

**Criterios de Aceptación:**
- La página debe mostrar estadísticas globales claras y actualizadas
- Cada proyecto debe mostrar:
  * Monto total pagado vs costo total
  * Número de pagos realizados
  * Porcentaje de completado con barra de progreso
  * Desglose de pagos por hitos (milestones)
- La interfaz debe seguir buenas prácticas de UX:
  * Información jerárquica y bien organizada
  * Sistema de acordeón para mostrar/ocultar detalles
  * Visualización clara del progreso
  * Consistencia en el formato de moneda y porcentajes
- El historial de pagos debe permitir búsqueda por proyecto, hito o descripción
- Los datos deben actualizarse en tiempo real al realizar nuevos pagos

**Validación y Resultados:**
- Se implementó exitosamente la página de pagos con todas las funcionalidades requeridas
- Se validó la correcta visualización de:
  * Estadísticas globales (total, cuenta y promedio de pagos)
  * Lista de proyectos con sus respectivos progresos
  * Desglose detallado de pagos por hito dentro de cada proyecto
  * Historial completo de pagos con funcionalidad de búsqueda
- Se comprobó la precisión de los cálculos:
  * Montos totales y pendientes por proyecto
  * Porcentajes de completado
  * Progreso de pagos por hito
- Se verificó la usabilidad y experiencia de usuario:
  * Navegación intuitiva entre proyectos
  * Visualización clara del progreso mediante barras
  * Funcionamiento correcto del sistema de acordeón
  * Respuesta inmediata en búsquedas y filtros
- Se confirmó la correcta integración con el backend y la actualización en tiempo real de los datos

**Estado: COMPLETADO**

## Sprint 9: % de tareas completadas vs % de pago del milestone
- Implementación de barras de progreso visuales para mostrar el avance de tareas y pagos
- Integración de información de progreso en la lista de proyectos y vista detallada
- Mejora de la usabilidad en formularios con navegación por teclado
- Optimización del manejo de estados y validaciones

**Criterios de Aceptación:**
- Cada milestone debe mostrar claramente:
  * Porcentaje de tareas completadas con barra de progreso azul
  * Porcentaje de pagos realizados con barra de progreso verde
  * Totales numéricos de tareas (completadas/total)
  * Montos de pagos (pagado/total)
- La vista general del proyecto debe mostrar:
  * Progreso total de tareas agregando todos los milestones
  * Progreso total de pagos considerando todos los milestones
  * Presupuesto total del proyecto
- Los formularios deben tener una mejor usabilidad:
  * Foco automático en el primer campo al abrir
  * Navegación entre campos usando Enter
  * Validaciones mejoradas (ej: coste opcional en milestones)
- La interfaz debe mantener consistencia visual:
  * Azul para progreso de tareas
  * Verde para progreso de pagos
  * Barras de progreso con contraste mejorado

**Validación y Resultados:**
- Se implementó exitosamente:
  * Barras de progreso con colores distintivos para tareas y pagos
  * Cálculo correcto de porcentajes totales del proyecto
  * Visualización de progreso en la lista de proyectos
  * Mejoras en la usabilidad de formularios
- Se validó la precisión de los cálculos:
  * Porcentajes de tareas completadas por milestone y total
  * Porcentajes de pagos realizados por milestone y total
  * Presupuestos y montos pendientes
- Se verificó la usabilidad:
  * Foco automático en formularios
  * Navegación fluida por teclado
  * Validaciones correctas en campos opcionales
- Se confirmó la consistencia visual:
  * Esquema de colores coherente
  * Contraste adecuado en barras de progreso
  * Diseño responsive en todas las vistas

**Estado: COMPLETADO**

## Sprint 10: Implementación de Base de Datos MongoDB y Modelos de Datos
- Implementación de MongoDB como base de datos principal para el almacenamiento de datos
- Creación de modelos de datos con Mongoose para proyectos, hitos, tareas y pagos
- Desarrollo de endpoints RESTful para la gestión de datos
- Integración completa con el frontend React

**Criterios de Aceptación:**
- Los modelos de datos deben incluir:
  * Proyecto: nombre, descripción, presupuesto total, fechas y estado
  * Hito (Milestone): nombre, descripción, presupuesto, estado de pago y relación con proyecto
  * Tarea: nombre, descripción, estado (PENDING/COMPLETED) y relación con hito
  * Pago: monto, fecha, método de pago y relación con hito

- La API debe proporcionar endpoints para:
  * CRUD completo de proyectos, hitos y tareas
  * Procesamiento de pagos con validaciones
  * Consulta de progreso y estadísticas
  * Historial de pagos por hito

- La base de datos debe garantizar:
  * Integridad referencial entre entidades
  * Índices optimizados para consultas frecuentes
  * Manejo eficiente de grandes volúmenes de datos

**Validación y Resultados:**
- Se implementó exitosamente MongoDB con los siguientes modelos:
  * Project: campos básicos más relaciones con milestones
  * Milestone: campos de seguimiento financiero y relación con proyecto
  * Task: sistema de estados y relación con milestone
  * Payment: registro detallado de transacciones

- Se validaron los endpoints mediante pruebas:
  * GET /projects: lista de proyectos con progreso calculado
  * GET /projects/:id: detalles del proyecto con hitos y tareas
  * POST/PUT/DELETE para todas las entidades
  * Endpoints específicos para pagos y progreso

- Se verificó la integridad de datos:
  * Eliminación en cascada de hitos y tareas
  * Actualización automática de estados de pago
  * Cálculo correcto de porcentajes y totales
  * Manejo adecuado de referencias entre documentos

- Se comprobó el rendimiento:
  * Tiempos de respuesta óptimos en consultas complejas
  * Actualización eficiente de estados y progreso
  * Escalabilidad con múltiples proyectos y transacciones

**Estado: COMPLETADO**

## Sprint 11: Avisos y alertas
- Añadir un indicador en la tarjeta del hito y en el proyecto cuando el % pagado sea superior al % de tareas completadas
- Incluir tareas completadas en el hito en un formato ej: 2/4 (50%)
- Añadir indicador visual (check verde) cuando todas las tareas del hito estén completadas

**Criterios de Aceptación:**
- El hito debe mostrar un icono de advertencia (⚠️) cuando el porcentaje de pago supere al porcentaje de tareas completadas
- El formato de tareas completadas debe mostrarse como "X/Y (Z%)" donde:
  * X = número de tareas completadas
  * Y = número total de tareas
  * Z = porcentaje de completitud
- El indicador de tareas debe mostrarse en verde cuando todas las tareas estén completadas (100%)
- El indicador de pagos debe mostrarse en verde cuando el hito esté completamente pagado (100%)
- Los indicadores deben ser consistentes tanto en la vista de hito como en la vista de progreso general

**Validación y Resultados:**
- Se implementaron los indicadores visuales en los componentes ProjectDetail y ProgressDisplay
- Se realizaron pruebas verificando:
  * Aparición correcta del icono de advertencia al realizar pagos que superan el progreso de tareas
  * Visualización correcta del formato de tareas completadas (X/Y Z%)
  * Cambio de color a verde del indicador de tareas al completar todas las tareas
  * Cambio de color a verde del indicador de pagos al completar todos los pagos
  * Consistencia visual entre la vista de hito y la vista de progreso general
- Se validó la funcionalidad en diferentes estados de los hitos:
  * Hitos sin tareas
  * Hitos con tareas parcialmente completadas
  * Hitos con todas las tareas completadas
  * Hitos con diferentes estados de pago
- Resultado: Los tests manuales confirman el correcto funcionamiento de todos los indicadores visuales y formatos de presentación.

**Estado: COMPLETADO**

## Sprint 12: Métodos de Pago e Indicadores Visuales
- Implementación de categorías para los tipos de pago:
  * Efectivo
  * Transferencia Bancaria
  * Bizum
  * PayPal
- Integración de los métodos de pago en el formulario de pagos
- Visualización de métodos de pago en el historial
- Diferenciación visual por colores según el método
- Posicionamiento de indicadores visuales en las tarjetas de proyecto:
  * Icono de advertencia (warning) en la esquina superior izquierda
  * Icono de pago necesario (monetization) a la derecha del warning si existe
  * Botón de eliminar en la esquina superior derecha

**Criterios de Aceptación:**
- El modelo de Payment debe incluir el campo paymentMethod con los valores permitidos
- El formulario de pago debe permitir:
  * Selección del método de pago desde un menú desplegable
  * Valor por defecto "Transferencia Bancaria"
  * Navegación por teclado entre campos
- En el historial de pagos:
  * Cada método debe mostrarse con un chip de color distintivo
  * Los colores deben ser consistentes:
    - Verde para Efectivo
    - Azul para Transferencia
    - Celeste para Bizum
    - Morado para PayPal
  * El texto debe mostrarse en español
- La interfaz debe mantener consistencia visual en todas las vistas donde se muestre el método de pago
- Los indicadores visuales en las tarjetas de proyecto deben:
  * Mostrar el icono de warning (⚠️) cuando el % de pago supere al % de tareas
  * Mostrar el icono de monetization (💰) cuando haya más tareas completadas que pagos
  * Posicionarse correctamente sin solapamiento:
    - Warning en (left: 8px, top: 8px)
    - Monetization en (left: 32px, top: 8px) si hay warning, o (left: 8px, top: 8px) si no
    - Botón eliminar en (right: 8px, top: 8px)

**Validación y Resultados:**
- Se implementó exitosamente:
  * Modelo de datos actualizado con el campo paymentMethod
  * Formulario de pago con selección de método
  * Visualización en el historial con chips de colores
  * Posicionamiento correcto de indicadores en tarjetas de proyecto
- Se validó la funcionalidad:
  * Creación de pagos con diferentes métodos
  * Persistencia correcta en la base de datos
  * Visualización consistente en todas las vistas
  * No solapamiento de iconos en las tarjetas
- Se verificó la usabilidad:
  * Selección intuitiva del método de pago
  * Navegación fluida por teclado
  * Claridad visual en la diferenciación de métodos
  * Tooltips informativos en los iconos de estado
- Se confirmó la consistencia visual:
  * Colores distintivos para cada método
  * Diseño responsive de los chips
  * Traducciones correctas al español
  * Alineación correcta de todos los elementos visuales

**Estado: COMPLETADO**

## Sprint 13: Corrección de errores en pagos
- Implementación de mensajes de error no intrusivos para pagos que exceden el coste total del milestone
- Funcionalidad para modificar y eliminar pagos desde el historial de pagos
- Integración de la gestión de pagos tanto en la página de pagos global como en los detalles de cada milestone

**Criterios de Aceptación:**
- Los mensajes de error deben:
  * Mostrarse dentro del formulario de pago, no como popups
  * Incluir información detallada (monto pagado, total y restante)
  * Mantener consistencia visual con el resto de la aplicación
- La edición y eliminación de pagos debe:
  * Estar disponible tanto en la vista global como en el detalle del milestone
  * Actualizar automáticamente el estado del milestone
  * Mantener la consistencia de los montos totales
- La interfaz debe:
  * Mostrar botones de edición y eliminación alineados correctamente
  * Proporcionar confirmación antes de eliminar pagos
  * Actualizar en tiempo real tras modificaciones

**Validación y Resultados:**
- Mensajes de error:
  * Se implementó el mensaje de error dentro del formulario usando el componente Alert
  * Se verificó la correcta visualización de montos con formatCurrency
  * Se comprobó que el mensaje incluye toda la información relevante
- Gestión de pagos:
  * Se añadieron endpoints en el backend para PUT y DELETE de pagos
  * Se implementó la actualización automática del estado del milestone
  * Se verificó la consistencia de datos tras modificaciones
- Interfaz de usuario:
  * Se alinearon correctamente los botones de acción en las tablas
  * Se implementó diálogo de confirmación para eliminación
  * Se verificó la actualización en tiempo real de los datos
- Pruebas realizadas:
  * Validación de montos al crear/editar pagos
  * Eliminación de pagos y actualización de milestone
  * Consistencia de datos en todas las vistas
  * Navegación y usabilidad del formulario

**Estado: COMPLETADO**

## Sprint 14: Control y representacion de impuestos
- Algunos hitos pueden aplicar impuestos y otros no, los impuestos se aplican sobre el coste total del hito
- Se debe diferenciar claramente el coste total del hito y el coste total con impuestos
- En el proyecto se debe mostrar el coste total y el coste total con impuestos
- En la pantalla payments se debe mostrar el coste total y el coste total con impuestos de cada proyecto en base a los hitos con y sin impuestos
- El valor (%) de impuestos se debe poder configurar en la pagina de Settings

**Criterios de Aceptación:**
- El modelo de Milestone debe incluir:
  * Campo `hasTax` (boolean) para indicar si aplica impuestos
  * Campo `taxRate` (number) para almacenar el porcentaje de impuestos
  * Cálculo automático del total con impuestos
- La interfaz debe mostrar claramente:
  * En el formulario de milestone: opción para habilitar/deshabilitar impuestos
  * En el detalle del milestone: monto base, monto de impuestos y total
  * En el proyecto: totales con y sin impuestos agregados
  * En la página de pagos: montos base y con impuestos para cada proyecto
- La página de Settings debe permitir:
  * Configurar el porcentaje de impuestos por defecto (IVA)
  * Validar que el valor esté entre 0 y 100
  * Mostrar el valor actual y la última actualización

**Validación y Resultados:**
- Se implementó exitosamente:
  * Modelo de datos con campos `hasTax` y `taxRate`
  * Cálculo automático de totales con impuestos en el backend
  * Visualización de montos base e impuestos en todas las vistas
  * Página de configuración de impuestos
- Se validó la funcionalidad:
  * Creación de hitos con y sin impuestos
  * Cálculo correcto de totales en proyectos
  * Persistencia del porcentaje de impuestos en la base de datos
  * Actualización del porcentaje por defecto
- Se verificó la interfaz:
  * Visualización clara de montos base e impuestos
  * Tooltips informativos con desglose de montos
  * Barras de progreso separadas para base e impuestos
  * Mensajes de éxito/error en la configuración
- Se confirmó la consistencia:
  * Formato correcto de montos en euros
  * Cálculos precisos con dos decimales
  * Actualización en tiempo real de los totales

**Estado: COMPLETADO**

## Sprint 15: Mejoras en la Gestión de Pagos Distribuidos y Optimización de UX
- Implementación de la edición de pagos distribuidos desde múltiples puntos de acceso (página de pagos y detalles del proyecto)
- Mejora de la experiencia de usuario manteniendo el contexto al editar pagos distribuidos
- Optimización del flujo de trabajo para mantener al usuario en su vista actual
- Implementación de validaciones y manejo de errores mejorado para pagos distribuidos
- Optimización de llamadas a la acción según el contexto de navegación:
  * Botón "Nuevo Proyecto" solo visible en la lista de proyectos
  * Botón "Nuevo Milestone" como acción principal en la vista de proyecto
  * Acciones contextuales adaptadas a cada vista

**Criterios de Aceptación:**
- Los pagos distribuidos deben poder editarse tanto desde:
  * La página principal de pagos (/payments)
  * El historial de pagos de cada hito en la vista de proyecto
- La edición de un pago distribuido debe:
  * Mostrar todas las distribuciones existentes
  * Permitir modificar montos individuales
  * Validar que la suma total coincida con el monto del pago
  * Mantener la consistencia de los datos en todas las vistas
- La interfaz debe:
  * Mostrar claramente que es un pago distribuido
  * Permitir ver y editar todas las distribuciones
  * Mantener al usuario en su contexto actual tras la edición
- El sistema debe:
  * Validar los montos antes de guardar
  * Actualizar correctamente los estados de los hitos
  * Refrescar los datos en todas las vistas afectadas

- Las llamadas a la acción deben ser contextuales:
  * En la lista de proyectos (/projects):
    - Mostrar "Nuevo Proyecto" como acción principal
    - No mostrar acciones específicas de proyecto
  * En la vista de proyecto (/projects/:id):
    - Mostrar "Nuevo Milestone" como acción principal
    - Mostrar acciones específicas del proyecto (editar, eliminar)
    - No mostrar "Nuevo Proyecto"
  * La interfaz debe mantener consistencia visual en todas las vistas
  * Las acciones deben reflejar las operaciones disponibles en cada contexto

**Validación y Resultados:**
- Se implementó exitosamente:
  * Edición de pagos distribuidos desde múltiples vistas
  * Formulario unificado para edición de pagos distribuidos
  * Sistema de navegación contextual
  * Validaciones de montos y distribuciones
- Se validó la funcionalidad:
  * Edición desde la página de pagos
  * Edición desde el historial de pagos del proyecto
  * Actualización correcta de montos y estados
  * Persistencia de datos tras ediciones
- Se verificó la usabilidad:
  * Mantenimiento del contexto del usuario
  * Claridad en la visualización de distribuciones
  * Mensajes de error informativos
  * Actualización en tiempo real de los datos
- Se confirmó la consistencia:
  * Datos sincronizados entre vistas
  * Estados de hitos actualizados correctamente
  * Montos totales y distribuciones coherentes
- Se validó la contextualización de acciones:
  * Correcta visualización de botones según la ruta
  * Consistencia en el estilo y ubicación de las acciones
  * Claridad en las acciones disponibles en cada vista
  * Mejora en la intuitividad de la interfaz
- Se verificó la experiencia de usuario:
  * Reducción de confusión en las acciones disponibles
  * Mayor claridad en el flujo de trabajo
  * Mejor organización visual de las acciones
  * Feedback positivo en pruebas de usabilidad

**Estado: COMPLETADO**

## Sprint 16: Exportar informe de proyectos
- Implementación de exportación de informes en formatos PDF y Excel
- Desarrollo de un diálogo de selección de formato siguiendo las mejores prácticas de UX/UI
- El informe incluye:
  * Nombre y descripción del proyecto
  * Presupuesto total (base y con impuestos)
  * Porcentajes de progreso (tareas y pagos)
  * Desglose detallado de cada milestone:
    - Nombre y descripción
    - Presupuesto (base, impuestos y total)
    - Porcentaje de tareas completadas
    - Porcentaje de pagos realizados
    - Lista detallada de tareas con su estado
    - Historial completo de pagos

**Criterios de Aceptación:**
- La generación de informes debe ser accesible desde la vista de detalle del proyecto
- El diálogo de selección de formato debe:
  * Mostrar opciones claras para PDF y Excel
  * Incluir iconos distintivos para cada formato
  * Permitir cancelar la operación
  * Ser accesible mediante teclado
- Los informes PDF deben:
  * Mantener un diseño profesional y consistente
  * Incluir barras de progreso visuales
  * Mostrar los montos formateados en euros
  * Organizar la información de forma jerárquica y clara
- Los informes Excel deben:
  * Contener múltiples hojas organizadas por tipo de información
  * Incluir una hoja de resumen general
  * Proporcionar desglose detallado de milestones
  * Separar tareas y pagos en hojas independientes

**Validación y Resultados:**
- Interfaz de Usuario:
  * Se implementó un diálogo Material-UI para la selección de formato
  * Se añadieron botones grandes con iconos distintivos
  * Se incluyó la opción de cancelar
  * Se verificó la navegación por teclado

- Generación de PDF:
  * Se validó la correcta generación del documento
  * Se comprobó la inclusión de todos los datos requeridos
  * Se verificó el formato correcto de montos y porcentajes
  * Se confirmó la legibilidad y organización jerárquica

- Generación de Excel:
  * Se verificó la creación de hojas separadas (Overview, Milestones, Tasks, Payments)
  * Se validó la correcta exportación de datos en cada hoja
  * Se comprobó el formato de las celdas y fórmulas
  * Se confirmó la facilidad de lectura y análisis

- Pruebas de Integración:
  * Se realizaron pruebas con proyectos de diferentes tamaños
  * Se verificó el manejo correcto de casos especiales (sin tareas, sin pagos)
  * Se comprobó la gestión de errores y mensajes al usuario
  * Se validó la descarga correcta de archivos en diferentes navegadores

**Estado: COMPLETADO**

## Sprint 17: Preparar despliegue en produccion
- Configuración del entorno de producción en Firebase Hosting y Render.com
- Implementación de variables de entorno para diferentes entornos (desarrollo/producción)
- Optimización del flujo de trabajo para mantener la consistencia entre entornos
- Mejora de la experiencia de usuario manteniendo el contexto de navegación

**Criterios de Aceptación:**
- El frontend debe desplegarse correctamente en Firebase Hosting
- El backend debe funcionar correctamente en Render.com
- Las variables de entorno deben configurarse adecuadamente según el entorno
- La aplicación debe mantener la misma funcionalidad en producción que en desarrollo
- Los usuarios deben permanecer en su contexto actual al realizar acciones (edición, eliminación)
- La navegación debe ser fluida y mantener el estado de la aplicación

**Validación y Resultados:**
- Despliegue Frontend:
  * Se verificó el correcto despliegue en Firebase Hosting (buildtrack-c3e8a.web.app)
  * Se comprobó la carga correcta de assets y recursos
  * Se validó el enrutamiento y navegación
  * Se confirmó la correcta integración con el backend

- Despliegue Backend:
  * Se verificó el funcionamiento en Render.com (buildtrack.onrender.com)
  * Se comprobó la conexión con la base de datos MongoDB
  * Se validó la correcta respuesta de todos los endpoints
  * Se confirmó el manejo adecuado de CORS y seguridad

- Experiencia de Usuario:
  * Se mejoró el flujo de edición de pagos manteniendo al usuario en su contexto
  * Se optimizó la navegación evitando redirecciones innecesarias
  * Se verificó la consistencia de datos en tiempo real
  * Se validó la experiencia de usuario en diferentes navegadores

- Pruebas de Integración:
  * Se realizaron pruebas end-to-end del flujo completo
  * Se verificó la comunicación correcta entre frontend y backend
  * Se comprobó el manejo de errores y casos límite
  * Se validó la persistencia de datos en la base de datos

**Estado: COMPLETADO**

## Sprint 18: Identificacio de usuarios
- el usuario debe identificarse con un email y una contraseña
- Cada usuario tendra su propio espacio de trabajo con sus propios proyectos, hitos, tareas, pagos, etc.
**Estado: TODO**


## Sprint 19: Hacer una applicacion para produccion que pueda ser usada por los usuarios (MVP)
- La aplicacion se debe poder instalar en un servidor de produccion
- La aplicacion debe ser accesible desde cualquier navegador

**Estado: TODO**

