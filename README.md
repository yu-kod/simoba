# simoba

Browser-based casual MOBA x .io game. 2v2 micro arena, max 5 min per match.

## Tech Stack

- **Frontend:** Phaser.js 3.x + Vite + TypeScript
- **Backend (Phase 2+):** Colyseus (WebSocket)
- **Infra:** Terraform + AWS (S3/CloudFront, ECS)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure

```
src/
  config/       # Game configuration
  scenes/       # Phaser scenes
openspec/
  specs/        # Game and tech specifications
infrastructure/ # Terraform + LocalStack
```

## License

Private
