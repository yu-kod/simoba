## ADDED Requirements

### Requirement: VPC Terraform モジュール
`infrastructure/terraform/modules/vpc/` に VPC ネットワーク基盤の Terraform モジュールを提供しなければならない（SHALL）。VPC、Public subnets（2 AZ）、Internet Gateway、Route table を定義しなければならない（SHALL）。

#### Scenario: Terraform モジュールが有効な構成を生成する
- **WHEN** `terraform plan` を VPC モジュールに対して実行する
- **THEN** エラーなく実行計画が生成される

#### Scenario: Public subnets が 2 AZ に配置される
- **WHEN** VPC モジュールが適用される
- **THEN** 2 つの異なるアベイラビリティゾーンに public subnet が作成される

### Requirement: Internet Gateway によるインターネット接続
VPC に Internet Gateway をアタッチし、public subnet からインターネットにアクセスできなければならない（SHALL）。

#### Scenario: Public subnet のリソースがインターネットにアクセスできる
- **WHEN** public subnet に配置された Fargate タスクが外部 API にリクエストを送信する
- **THEN** Internet Gateway 経由で通信が成功する

### Requirement: モジュール出力
VPC モジュールは `vpc_id` と `public_subnet_ids` を output として公開しなければならない（SHALL）。

#### Scenario: 他のモジュールが VPC output を参照できる
- **WHEN** game-server モジュールが VPC モジュールの output を変数として受け取る
- **THEN** `vpc_id` と `public_subnet_ids` が正しく渡される
