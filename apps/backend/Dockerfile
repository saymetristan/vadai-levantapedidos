FROM denoland/deno:1.40.0

WORKDIR /app

# Copia configs y src
COPY deno.json .
COPY src/ src/

# Cachea dependencias
RUN deno cache src/main.ts

# Expone puerto (usa ENV para flexibilidad)
EXPOSE 8000

# Comando de run con permisos
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "src/main.ts"] 