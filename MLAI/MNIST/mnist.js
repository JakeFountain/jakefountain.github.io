// index.js
// import 'bootstrap/dist/css/bootstrap.css'
import * as tf from '/node_modules/@tensorflow/tfjs'
import * as tfvis from '/node_modules/@tensorflow/tfjs-vis'
// import $ from 'jquery'
// require('babel-polyfill')

import {MnistData} from './mnist_data.js'
import * as util from './mnist_utils.js'
import {initCanvas} from './draw_utils.js'

let data = new MnistData()
$('#load-data-btn').click(async()=>{
	let msg = $('#loading-data');
	msg.text('Downloading MNIST data....');
	await data.load(40000,10000);

	msg.toggleClass('badge-warning badge-success');
	msg.text('MNIST data downloaded!');
	//what is this? : $('#load-btn').prop('disabled',true);

	const [x_test,y_test] = data.getTestData(8);
	const labels = Array.from(y_test.argMax(1).dataSync());
	util.showExample('mnist-preview', x_test, labels);
});

$('input[name=optmodel]:radio').click(function() {
    $('#model').text(util.getModel(this.value))
});

let model = tf.sequential()    
$('#init-btn').click(function() {
    var md = $.trim($('#model').val())
    eval(md)
    tfvis.show.modelSummary($('#summary')[0], model)
    $('#train-btn').prop('disabled', false)
    $('#predict-btn').prop('disabled', false)
    $('#eval-btn').prop('disabled', false)
    $('#show-example-btn').prop('disabled', false)
});

let round = (num) => parseFloat(num*100).toFixed(1);

$('#train-btn').click(async() => {        
    var msg = $('#training')
    msg.toggleClass('badge-warning badge-success')    
    msg.text('Training, please wait...')    
    
    var epoch = parseInt($('#epoch').val())
    var batch = parseInt($('#batch').val())
    
    const [x_train, y_train] = data.getTrainData()
    
    let nIter = 0
    const numIter = Math.ceil(x_train.shape[0] / batch) * epoch    
    $('#num-iter').text('Num Training Iteration: '+ numIter)
        
    const trainLogs = []
    const loss = $('#loss-graph')[0]
    const acc = $('#acc-graph')[0]

    const history = await model.fit(x_train, y_train, {
        epochs: epoch,
        batchSize: batch,
        shuffle: true,
        callbacks: {
            onBatchEnd: async (batch, logs) => {
                nIter++
                trainLogs.push(logs)
                tfvis.show.history(loss, trainLogs, ['loss'], { width: 300, height: 160 })
                tfvis.show.history(acc, trainLogs, ['acc'], { width: 300, height: 160 })
                $('#train-iter').text(`Training..( ${round(nIter / numIter)}% )`)
                $('#train-acc').text('Training Accuracy : '+ round(logs.acc) +'%')
            },
        }
    })
    
    $('#train-iter').toggleClass('badge-warning badge-success')    
    msg.toggleClass('badge-warning badge-success')    
    msg.text('Training Done')
    $('#save-btn').prop('disabled', false)        
});

$('#eval-btn').click(async() => {    
    let [x_test, y_test] = data.getTestData()
    
    let y_pred = model.predict(x_test).argMax(1)
    let y_label = y_test.argMax(1)
    
    let eval_test = await tfvis.metrics.accuracy(y_label, y_pred)
    $('#test-acc').text( 'Testset Accuracy : '+ round(eval_test)+'%')   
    
    const classNames = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const conf = $('#confusion-matrix')[0]
    const acc = $('#class-accuracy')[0]
    
    const classaAcc = await tfvis.metrics.perClassAccuracy(y_label,y_pred)
    const confMt = await tfvis.metrics.confusionMatrix(y_label, y_pred)    

    tfvis.show.perClassAccuracy(acc, classaAcc, classNames)
    tfvis.render.confusionMatrix(conf, { values: confMt , tickLabels: classNames })
});

$('#show-example-btn').click(function(){
    let [x_test, y_test] = data.getTestData(16)
    let y_pred = model.predict(x_test)
    const labels = Array.from(y_test.argMax(1).dataSync())
    const predictions = Array.from(y_pred.argMax(1).dataSync())
    util.showExample('example-preview', x_test, labels, predictions )
});

$('#save-btn').click(async() => {
    const saveResults = await model.save('downloads://')
    
    // Uncommnt for Firefox browser
    // util.firefoxSave(model)
    
    $('#saved').show()
    setTimeout(function() {
        $('#saved').fadeOut()
    }, 1000)
});

$('#load-model-btn').click(async() => {    
    $('#loaded').show()
    
    const jsonUpload = $('#json-upload')[0]
    const weightsUpload = $('#weights-upload')[0]
    model = await tf.loadLayersModel(tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]))
    
    $('#predict-btn').prop('disabled', false)
    
    setTimeout(function() {
        $('#loaded').fadeOut()
    }, 1000)
    
    if (data.isDownloaded){        
        $('#eval-btn').prop('disabled', false)
        $('#show-example-btn').prop('disabled', false)
    }
});

initCanvas('predict-canvas')

$('#clear-btn').click(function(){
    var canvas = $('#predict-canvas')[0]
    var context = canvas.getContext('2d')
    context.clearRect(0, 0, canvas.width, canvas.height)
})

$('#predict-btn').click(async() => {
    var canvas = $('#predict-canvas')[0]
    var preview = $('#preview-canvas')[0]
    
    var img = tf.browser.fromPixels(canvas, 4)
    var resized = util.cropImage(img, canvas.width)    
    tf.browser.toPixels(resized, preview)    
    
    var x_data = tf.cast(resized.reshape([1, 28, 28, 1]), 'float32')    
    var y_pred = model.predict(x_data)    
    var prediction = Array.from(y_pred.argMax(1).dataSync())    
    $('#prediction').text( 'Predicted: '+ prediction)    
    
    const barchartData = Array.from(y_pred.dataSync()).map((d, i) => {
        return { index: i, value: d }
    })
    tfvis.render.barchart($('#predict-graph')[0], barchartData,  { width: 400, height: 140 }) 
});

$('#dissect-cnn-btn').click(function(){
	util.visualiseCNN('cnn-dissection',model,parseInt($('#image-scale-input').val()));
});



