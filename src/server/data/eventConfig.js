const eventConfig = {
  eventId: 'test-event-25-05-26',
  botId: 'fototime323-bot',
  eventName: 'Тестовое мероприятие FOTOTIME323',
  status: 'active',
  language: 'ru',
  resultOrientation: 'portrait',

  participants: [
    {
      id: 'male',
      name: 'Мужчина',
      isActive: true
    },
    {
      id: 'female',
      name: 'Женщина',
      isActive: true
    },
    {
      id: 'couple',
      name: 'Пара',
      isActive: true
    },
    {
      id: 'boy',
      name: 'Мальчик',
      isActive: true
    },
    {
      id: 'girl',
      name: 'Девочка',
      isActive: true
    },
    {
      id: 'family',
      name: 'Семья',
      isActive: true
    }
  ],

  styles: [
    {
      id: 'ns-valentine-01',
      name: 'NS Валентинка №1',
      participantType: 'female',
      previewUrl: '/assets/styles/ns-valentine-01.svg',
      price: 0.34,
      isAvailable: true
    },
    {
      id: 'ns-spring-city',
      name: 'NS Весна в городе',
      participantType: 'female',
      previewUrl: '/assets/styles/ns-spring-city.svg',
      price: 0.34,
      isAvailable: true
    },
    {
      id: 'ns-dryad-01',
      name: 'NS Дриада I',
      participantType: 'female',
      previewUrl: '/assets/styles/ns-dryad-01.svg',
      price: 0.34,
      isAvailable: true
    },
    {
      id: 'ns-astral',
      name: 'NS Астрал',
      participantType: 'male',
      previewUrl: '/assets/styles/ns-astral.svg',
      price: 0.34,
      isAvailable: true
    },
    {
      id: 'ns-hogwarts-stairs',
      name: 'NS Хогвартс: Главная лестница',
      participantType: 'male',
      previewUrl: '/assets/styles/ns-hogwarts-stairs.svg',
      price: 0.34,
      isAvailable: true
    }
  ]
};

module.exports = eventConfig;
