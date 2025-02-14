# Roadmap - BuildTrack Project

Este documento describe el plan de desarrollo incremental del proyecto BuildTrack siguiendo una metodología Agile, permitiéndote aprender y adaptar cada tecnología paso a paso.

## Sprint 0: Setup Inicial
- Crear el repositorio y la estructura de carpetas (por ejemplo, directorios `backend` y `frontend`).
- Decidir las tecnologías: se sugiere usar Node.js con Express para el backend y React para el frontend, con PostgreSQL (u otra base de datos) para la persistencia de datos.
- Configurar el entorno de desarrollo e instalar dependencias básicas.
- Realizar un commit inicial con la estructura básica del proyecto.

## Sprint 1: Funcionalidad Básica de Autenticación
- Implementar el registro y login de usuarios (puedes probar algo sencillo usando JWT o Passport).
- Crear endpoints en el backend para manejar la autenticación y formularios básicos en el frontend.
- Documentar el proceso y realizar pruebas iniciales.

## Sprint 2: Gestión de Proyectos
- Desarrollar una API CRUD para proyectos, permitiendo a los usuarios crear, leer, actualizar y eliminar proyectos.
- Diseñar formularios e interfaces en el frontend para gestionar estos proyectos.
- Validar y probar la integración entre frontend y backend.

## Sprint 3: Gestión de Tareas y Hitos
- Añadir funcionalidad para agregar tareas y hitos dentro de cada proyecto.
- Asociar cada tarea/hito a un proyecto y definir estados de completado.
- Actualizar la interfaz de usuario para reflejar la estructura de tareas/hitos.

## Sprint 4: Sistema de Pagos
- Diseñar un esquema para gestionar pagos de forma escalonada (por ejemplo, pagos basados en hitos o porcentajes).
- Crear endpoints en el backend para simular la lógica del sistema de pagos.
- Integrar la funcionalidad de pagos en la interfaz de usuario.

## Sprint 5: Seguimiento de Desviaciones de Presupuesto
- Implementar la lógica para registrar desviaciones entre el presupuesto inicial y los gastos reales en cada proyecto.
- Permitir el registro de la razón de la desviación y calcular porcentajes de cambios.
- Visualizar esta información en el frontend, ya sea en forma de tablas o gráficos.

## Sprint 6: Dashboard y Reportes
- Crear un dashboard para dar una vista general del progreso de los proyectos, estados de tareas, pagos y desviaciones.
- Permitir la generación de reportes, con la opción de exportar a PDF o Excel (inicialmente, una versión básica es suficiente).
- Realizar refactorizaciones y mejoras en la interfaz.

## Sprint 7: Mejoras, Pruebas y Despliegue
- Mejorar la experiencia de usuario y pulir detalles de la interfaz.
- Implementar pruebas unitarias y de integración a lo largo del proyecto.
- Preparar el despliegue del proyecto en un entorno de producción. 