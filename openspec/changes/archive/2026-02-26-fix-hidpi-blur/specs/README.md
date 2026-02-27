No delta specs required for this change.

The fix adds `resolution: window.devicePixelRatio` to `gameConfig`. This is a configuration-level fix that doesn't change any capability requirements. Phaser internally handles the resolution scaling, so all existing rendering specs (hero-rendering, hp-bar-rendering, etc.) remain valid as-is.
