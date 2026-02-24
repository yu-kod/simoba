## Requirements

### Requirement: ACM ワイルドカード証明書
`modules/dns/` モジュールは、指定ドメインのワイルドカード証明書（`*.simoba.yu-web.site`）とベースドメイン（`simoba.yu-web.site`）の SAN 証明書を2リージョン（`us-east-1` for CloudFront、`ap-northeast-1` for ALB）に作成しなければならない（SHALL）。DNS 検証を Route 53 で自動化しなければならない（SHALL）。

#### Scenario: 証明書が DNS 検証で発行される
- **WHEN** `terraform apply` を実行する
- **THEN** ACM 証明書が DNS 検証レコード経由で `ISSUED` ステータスになる

#### Scenario: CloudFront 用証明書が us-east-1 に作成される
- **WHEN** 証明書リソースを確認する
- **THEN** CloudFront 用の証明書が `us-east-1` リージョンに存在する

### Requirement: Route 53 DNS レコード
フロントエンド用の A エイリアスレコード（`simoba.yu-web.site` → CloudFront）と API 用の A エイリアスレコード（`api.simoba.yu-web.site` → ALB）を作成しなければならない（SHALL）。

#### Scenario: フロントエンドドメインが CloudFront を指す
- **WHEN** `simoba.yu-web.site` を名前解決する
- **THEN** CloudFront ディストリビューションの IP が返される

#### Scenario: API ドメインが ALB を指す
- **WHEN** `api.simoba.yu-web.site` を名前解決する
- **THEN** ALB の IP が返される

### Requirement: DNS モジュールの変数設計
`hosted_zone_id`、`domain_name`（ベースドメイン）を必須変数として受け取らなければならない（SHALL）。CloudFront distribution と ALB の情報は入力変数として受け取り、DNS レコードを作成しなければならない（SHALL）。
