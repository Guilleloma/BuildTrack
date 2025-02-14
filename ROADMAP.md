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

## Sprint 10: Dashboard, Reportes y Seguimiento de Presupuestos
- Crear un dashboard interactivo que brinde una vista general del progreso del proyecto, integrando información de proyectos, hitos, tareas, pagos y desviaciones presupuestarias.
- Implementar la lógica para el seguimiento de desviaciones entre el presupuesto inicial y los gastos reales, permitiendo el registro de razones y cálculos de porcentajes.
- Permitir la generación y exportación de reportes en formatos PDF y Excel.
- Realizar refactorizaciones y mejoras en la interfaz para integrar los nuevos componentes visuales.
+ Validación:
+ - Se validarán los endpoints y la integración del dashboard mediante pruebas manuales y unitarias, confirmando la exactitud y actualización en tiempo real de la información.
**Estado: TODO**

## Sprint 11: Mejoras, Pruebas y Despliegue
- Optimizar la experiencia de usuario integrando la asociación de proyectos a usuarios, aprovechando la autenticación implementada en el Sprint 1.
- Implementar pruebas unitarias y de integración con una cobertura mínima del 80%, asegurando la estabilidad de las funcionalidades implementadas.
- Corregir bugs críticos y realizar mejoras de rendimiento en toda la aplicación.
- Preparar el despliegue del proyecto en un entorno de pre-producción y realizar pruebas de aceptación final (UAT).
+ Validación:
+ - Se confirmará el correcto funcionamiento del sistema mediante un conjunto completo de pruebas de integración y usabilidad en un entorno de pre-producción.
**Estado: TODO**

