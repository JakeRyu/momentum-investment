import { storeFor } from '../appStore';

describe('storeFor', () => {
  it('sends Android to the Play listing', () => {
    expect(storeFor('android')).toEqual({
      name: 'Google Play',
      url: 'https://play.google.com/store/apps/details?id=com.jake.momentuminvestment',
    });
  });

  it('sends iOS to the App Store listing', () => {
    expect(storeFor('ios')).toEqual({
      name: 'the App Store',
      url: 'https://apps.apple.com/app/id6785231353',
    });
  });
});
