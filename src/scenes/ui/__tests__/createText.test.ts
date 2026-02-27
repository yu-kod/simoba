vi.mock('phaser', () => ({
  default: {
    Scene: class {},
  },
}))

import { createText } from '@/scenes/ui/createText'

const DEFAULT_FONT_FAMILY = '"Segoe UI", "Helvetica Neue", Arial, sans-serif'

describe('createText', () => {
  const mockTextObject = {}
  const mockScene = {
    add: {
      text: vi.fn().mockReturnValue(mockTextObject),
    },
  } as unknown as Phaser.Scene

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a text object with default font family', () => {
    createText(mockScene, 100, 200, 'Hello', { fontSize: '24px' })

    expect(mockScene.add.text).toHaveBeenCalledWith(100, 200, 'Hello', {
      fontFamily: DEFAULT_FONT_FAMILY,
      fontSize: '24px',
    })
  })

  it('should allow overriding font family via style', () => {
    createText(mockScene, 0, 0, 'Custom', { fontFamily: 'monospace' })

    expect(mockScene.add.text).toHaveBeenCalledWith(0, 0, 'Custom', {
      fontFamily: 'monospace',
    })
  })

  it('should return the text object', () => {
    const result = createText(mockScene, 0, 0, 'Test')

    expect(result).toBe(mockTextObject)
  })

  it('should apply default font family when no style provided', () => {
    createText(mockScene, 50, 50, 'No style')

    expect(mockScene.add.text).toHaveBeenCalledWith(50, 50, 'No style', {
      fontFamily: DEFAULT_FONT_FAMILY,
    })
  })
})
