
describe('Util', function() {
    it('Split & Concat(small chunk)', function () {
        var array = new Uint8Array(20);
        for(var i = 0; i < array.length; i++){
            array[i] = i;
        }

        var data = DataTransmitter.Util.split(array, 2);
        var unpackData = DataTransmitter.Util.merge(data);
        expect(array).to.eql(unpackData);
    });

    it('Split & Concat(large chunk)', function () {
        var array = new Uint8Array(20);
        for(var i = 0; i < array.length; i++){
            array[i] = i;
        }

        var data = DataTransmitter.Util.split(array, 2000);
        var unpackData = DataTransmitter.Util.merge(data);
        expect(array).to.eql(unpackData);
    });
});

