
describe('PeerFactory', function() {
    it('RomoPeer', function () {
        var item = {hoge: "moge", moge: 2};
        var pack = MessagePack.encode(item);
        var unpack = MessagePack.decode(pack);
        expect(item).to.eql(unpack);
    });
});