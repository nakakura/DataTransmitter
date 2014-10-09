
describe('Packetmanager', function() {
    it('pack and unpack', function () {
        var array = new Array(20);
        for(var i = 0; i < array.length; i++){
            array[i] = i;
        }

        var packetManager = new DataTransmitter.PacketManager(10);
        var data = packetManager.dataToSendPacketArray(array, "hoge");
        packetManager.recvPacketsArrayToData(function(data){
            expect(array).to.eql(data);
        });
    });
});

