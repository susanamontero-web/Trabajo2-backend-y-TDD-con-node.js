Descripción del proyecto: 
Primero se realizó las instalaciones respectivas para realizar el proyecto, se realizaron pruebas las cuales funcionaron correctmente
también diseñé y elegí colores suaves y me ayudé con codex! 

Estudiante: Susana Montero Paredes
Docente: Pablo Calderon Cornejo

Tecnologías utilizadas: 
Angular 22, TypeScript, HTML, CSS, Node.js, Express, MySQL, mysql2, Vitest y Supertest.

Instrucciones de instalación:
1. Clonar el repositorio:
   git clone https://github.com/susanamontero-web/Trabajo2-backend-y-TDD-con-node.js.git
   cd Trabajo2-backend-y-TDD-con-node.js
   
2. Instalar las dependencias:
   copiar y pegar en la terminal 
   npm run install:all
  
3. Copiar `backend/.env.example` como `backend/.env` y completar las credenciales de MySQL.
   
4. Iniciar MySQL y crear la base de datos:
   copiar y pegar en la terminal
   npm run db:init

Instrucciones de ejecución:
Ejecutar cada comando en una terminal diferente, desde la carpeta principal:
copiar y pegar en la terminal: 
1) npm run start:backend
2) npm run start:frontend


Estructura general del proyecto:
- `frontend/`: interfaz Angular, componentes, rutas y servicio HTTP
- `backend/src/`: API Express, validaciones y consultas a MySQL
- `backend/sql/`: estructura de la base de datos
- `backend/scripts/`: inicialización de la base de datos
- `backend/test/` y `backend/integration/`: pruebas del backend y de integración

Funcionalidades implementadas:
Se puede listar, editar , consultar algo y también eliminar un tickets, incluyen validaciones, 
confirmación al eliminar, mensajes de error y persistencia en MySQL.

Pruebas realizadas:
se realizaron 26 pruebas automatizadas aprobadas: 16 del backend, 9 del frontend y 1 de integración con MySQL y también
se verificó la persistencia tras reiniciar la API, la compilación y el funcionamiento manual de la interfaz.

Para ejecutar las comprobaciones, con MySQL configurado:
copiar y pegar en la terminal:
npm run test:all

Declaración de uso de Inteligencia Artificial:
Utilicé Codex para generar y configurar el frontend, backend, conexión con MySQL y pruebas automatizadas

