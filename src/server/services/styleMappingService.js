const DEFAULT_CYBERPHOTOBOOTH_STYLE = process.env.CYBERPHOTOBOOTH_STYLE || '1029';

const STYLE_MAPPING = {
  comic: {
    type: 'style',
    value: DEFAULT_CYBERPHOTOBOOTH_STYLE
  },
  'ns-valentine-01': {
    type: 'style',
    value: 'Kaftan'
  },
  'ns-spring-city': {
    type: 'style',
    value: '1093'
  },
  'ns-dryad-01': {
    type: 'style',
    value: '1252'
  },
  'ns-astral': {
    type: 'style',
    value: '1259'
  },
  'ns-hogwarts-stairs': {
    type: 'style',
    value: '1027'
  }
};

function getCyberPhotoBoothStyleMapping(styleId) {
  const normalizedStyleId = String(styleId || '').trim();

  if (STYLE_MAPPING[normalizedStyleId]) {
    return STYLE_MAPPING[normalizedStyleId];
  }

  if (/^\d+$/.test(normalizedStyleId)) {
    return {
      type: 'style',
      value: normalizedStyleId
    };
  }

  return {
    type: 'style',
    value: DEFAULT_CYBERPHOTOBOOTH_STYLE
  };
}

module.exports = {
  getCyberPhotoBoothStyleMapping
};
