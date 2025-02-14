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
+ Estado: COMPLETADO

## Sprint 6: Seguimiento de Desviaciones de Presupuesto
- Implementar la lógica para registrar desviaciones entre el presupuesto inicial y los gastos reales en cada proyecto.
- Permitir el registro de la razón de la desviación y calcular porcentajes de cambios.
- Visualizar esta información en el frontend, ya sea en forma de tablas o gráficos.

+ **Criterios de Aceptación y Test:**
+ - La API debe permitir ingresar y almacenar datos sobre las desviaciones presupuestarias.
+ - El frontend debe mostrar de forma clara las tablas o gráficos con los porcentajes calculados.
+ - Se realizarán pruebas que confirmen la precisión de los cálculos y la correcta actualización de los datos.

## Sprint 6: Dashboard y Reportes
- Crear un dashboard para dar una vista general del progreso de los proyectos, estados de tareas, pagos y desviaciones.
- Permitir la generación de reportes, con la opción de exportar a PDF o Excel (inicialmente, una versión básica es suficiente).
- Realizar refactorizaciones y mejoras en la interfaz.

+ **Criterios de Aceptación y Test:**
+ - El dashboard debe mostrar datos en tiempo real de manera organizada en gráficos y tablas.
+ - La funcionalidad de exportación debe generar archivos PDF y Excel correctamente.
+ - Se ejecutarán pruebas de usabilidad y de funcionalidad para asegurar una experiencia de usuario óptima.

## Sprint 7: Mejoras, Pruebas y Despliegue
- Mejorar la experiencia de usuario y pulir detalles de la interfaz.
- Implementar pruebas unitarias y de integración a lo largo del proyecto.
- Preparar el despliegue del proyecto en un entorno de producción.
- Integrar la asociación de proyectos a usuarios, aprovechando la autenticación implementada en el Sprint 1.

+ **Criterios de Aceptación y Test:**
+ - Todas las funcionalidades clave deben estar cubiertas por tests unitarios e integración con una cobertura mínima del 80%.
+ - Se deben corregir todos los bugs críticos y optimizar el rendimiento de la aplicación.
+ - El sistema debe ser desplegado correctamente en un entorno de pre-producción y pasar pruebas de aceptación final (UAT).

