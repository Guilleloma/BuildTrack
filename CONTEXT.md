# Instrucciones de Contexto

Este documento mantiene un registro de las instrucciones y preferencias importantes para el desarrollo y mantenimiento del proyecto.

## Procedimientos de Desarrollo

### Infraestructura
- Frontend: Firebase Hosting (buildtrack-c3e8a.web.app)
- Backend: Render.com (buildtrack.onrender.com)
- Base de datos: MongoDB Atlas

### Gestión de Cambios y Deploy
1. Para cualquier cambio en el código:
   - Realizar el cambio
   - Hacer commit y push al repositorio y build y deploy: `git add . && git commit -m "descripción" && git push origin development && cd frontend && npm run build && cd .. && firebase deploy` (Recuerda comprobar en que carpeta te encuentras)
   - Verificar el despliegue en buildtrack-c3e8a.web.app
   - El backend en Render.com (buildtrack.onrender.com) se actualiza automáticamente con cada push a development
   - La base de datos MongoDB Atlas está conectada automáticamente con el backend

### Logging y Debugging
1. Implementar logs detallados para todos los procesos:
   - Registrar inicio y fin de operaciones importantes
   - Incluir información relevante para debugging
   - Mantener diferentes niveles de log (info, warning, error)
   - Asegurar que los errores incluyan suficiente contexto para su análisis
   - Los logs del backend se pueden consultar en el dashboard de Render.com
   - Los logs de la base de datos se pueden consultar en MongoDB Atlas

### Principios de UX/UI
1. Seguir mejores prácticas de experiencia de usuario:
   - Proporcionar feedback visual para todas las acciones
   - Mantener tiempos de carga y respuesta óptimos
   - Implementar estados de loading cuando sea necesario
   - Mostrar mensajes de error claros y accionables
   - Asegurar que la interfaz sea intuitiva y fácil de usar

2. Mantener consistencia en el diseño:
   - Usar el sistema de diseño establecido
   - Mantener espaciado y tipografía consistentes
   - Asegurar que los elementos interactivos sean reconocibles
   - Implementar diseño responsive para todos los tamaños de pantalla

## Historial de Actualizaciones
- [FECHA] Instrucción inicial sobre procedimiento de cambios y deploy
- [FECHA] Agregadas instrucciones sobre logging y mejores prácticas de UX/UI
- [FECHA] Actualizado el proceso de build y deploy con pasos específicos para Firebase y Render
- [FECHA] Agregada información sobre MongoDB Atlas y actualizada la sección de logging
- [FECHA] Actualizado el flujo de trabajo para usar la rama development 
