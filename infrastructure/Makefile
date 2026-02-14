.PHONY: help localstack-up localstack-down local-init local-plan local-apply local-destroy local-output aws-init aws-plan aws-apply

help:
	@echo "=== Simoba Infrastructure ==="
	@echo ""
	@echo "LocalStack:"
	@echo "  make localstack-up      Start LocalStack"
	@echo "  make localstack-down    Stop LocalStack"
	@echo "  make local-init         terraform init (local)"
	@echo "  make local-plan         terraform plan (local)"
	@echo "  make local-apply        terraform apply (local)"
	@echo "  make local-destroy      terraform destroy (local)"
	@echo "  make local-output       terraform output (local)"
	@echo ""
	@echo "AWS:"
	@echo "  make aws-init ENV=prod    terraform init"
	@echo "  make aws-plan ENV=prod    terraform plan"
	@echo "  make aws-apply ENV=prod   terraform apply"

# --- LocalStack ---

localstack-up:
	cd docker && docker compose up -d
	@echo "Waiting for LocalStack..."
	@sleep 5
	@curl -s http://localhost:4566/_localstack/health | python3 -m json.tool 2>/dev/null || echo "LocalStack starting..."
	@echo "LocalStack ready at http://localhost:4566"

localstack-down:
	cd docker && docker compose down

# --- Local (LocalStack) ---

local-init:
	cd terraform/environments/local && terraform init

local-plan:
	cd terraform/environments/local && terraform plan

local-apply:
	cd terraform/environments/local && terraform apply -auto-approve

local-destroy:
	cd terraform/environments/local && terraform destroy -auto-approve

local-output:
	cd terraform/environments/local && terraform output

# --- AWS ---

aws-init:
	@if [ -z "$(ENV)" ]; then echo "Usage: make aws-init ENV=prod"; exit 1; fi
	cd terraform/environments/$(ENV) && terraform init

aws-plan:
	@if [ -z "$(ENV)" ]; then echo "Usage: make aws-plan ENV=prod"; exit 1; fi
	cd terraform/environments/$(ENV) && terraform plan

aws-apply:
	@if [ -z "$(ENV)" ]; then echo "Usage: make aws-apply ENV=prod"; exit 1; fi
	cd terraform/environments/$(ENV) && terraform apply
