## MODIFIED Requirements

### Requirement: ヒーローキルによるレベルアップ

ヒーローキル XP でレベルアップ閾値に到達した場合、`computeLevelUp` で新レベルを算出し、`applyStatsGrowth` でステータスを成長させなければならない（SHALL）。複数レベル分の閾値を超えた場合も一括で処理しなければならない（SHALL）。レベルアップ時に `talentPoints` をレベル上昇分だけ加算しなければならない（SHALL）。`talentPoints` 加算後、`effectiveStats` の再計算は不要である（タレント取得時に再計算するため）。

#### Scenario: キルXPでレベルアップ

- **WHEN** Lv1・XP=0 のヒーローが `HERO_KILL_XP_REWARD`(150) XP を獲得する
- **THEN** XP が 150 になり、level が 2 になる（XP_THRESHOLDS[1]=100 を超過）
- **THEN** ステータスが growth 分成長する
- **THEN** talentPoints が 1 加算される

#### Scenario: 複数レベルジャンプ時のポイント付与

- **WHEN** Lv1・XP=0 のヒーローが一度に 300 XP を獲得する
- **THEN** level が 3 になる（2レベル分ジャンプ）
- **THEN** talentPoints が 2 加算される
