const DEFAULT_CYBERPHOTOBOOTH_STYLE = process.env.CYBERPHOTOBOOTH_STYLE || '1029';

const STYLE_MAPPING = {
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
  return STYLE_MAPPING[styleId] || {
    type: 'style',
    value: DEFAULT_CYBERPHOTOBOOTH_STYLE
  };
}

module.exports = {
  getCyberPhotoBoothStyleMapping
};
