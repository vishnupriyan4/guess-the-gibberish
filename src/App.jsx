import React from "react";
import "./App.css";
import p5 from "p5";
import * as ml5 from "ml5";
import { questions } from "./assets/question";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
    this.defaultText = "Guess the Gibberish";
    this.timerCount = 0; 
    this.currentQuestionIndex = 0;
    this.state = {
      filters: [],
      selectedFilter: -1,
      questionBlock: {
        display: this.defaultText,
      },
      interval: null,
      showBeginButton: true
    };
    // console.log(questions);
  }

  changeFilter = () => {
    if (this.state.selectedFilter === 7) {
      this.setState({ selectedFilter: -1 });
    } else {
      this.setState((prevState) => ({
        selectedFilter: prevState.selectedFilter++,
      }));
    }
    // console.log(window.innerHeight, window.innerWidth);
  };

  Sketch = (p) => {
    let video;
    let filter = [
      p.GRAY,
      p.OPAQUE,
      p.THRESHOLD,
      p.INVERT,
      p.POSTERIZE,
      p.DILATE,
      p.BLUR,
      p.ERODE,
    ];
    let poseNet;
    let pose;
    let noseLerp;
    let rightEyeLerp;
    let leftEyeLerp;
    this.setState({ filters: filter });

    p.setup = () => {
      // p.createCanvas(640, 480);
      p.createCanvas(window.innerWidth, window.innerHeight);
      video = p.createCapture("VIDEO");
      video.hide();
      poseNet = ml5.poseNet(video, modelReady);
      poseNet.on("pose", gotPoses);
      noseLerp = p.createVector();
      rightEyeLerp = p.createVector();
      leftEyeLerp = p.createVector();
    };

    function modelReady() {
      console.log("Model Ready");
    }

    function gotPoses(poses) {
      // console.log(poses);
      if (poses.length > 0) {
        pose = poses[0].pose.keypoints;
      }
    }

    p.draw = () => {
      p.image(video, 0, 0);
      if (this.state.selectedFilter > 0) {
        if (this.state.selectedFilter === 4) {
          p.filter(this.state.filters[this.state.selectedFilter], 4);
        } else {
          p.filter(this.state.filters[this.state.selectedFilter]);
        }
      }
      if (pose) {
        noseLerp.x = p.lerp(noseLerp.x, pose[0].position.x, 0.2);
        noseLerp.y = p.lerp(noseLerp.y, pose[0].position.y, 0.2);
        rightEyeLerp.x = p.lerp(rightEyeLerp.x, pose[1].position.x, 0.2);
        rightEyeLerp.y = p.lerp(rightEyeLerp.y, pose[1].position.y, 0.2);
        leftEyeLerp.x = p.lerp(leftEyeLerp.x, pose[2].position.x, 0.2);
        leftEyeLerp.y = p.lerp(leftEyeLerp.y, pose[2].position.y, 0.2);
        let dist = p.dist(
          rightEyeLerp.x,
          rightEyeLerp.y,
          noseLerp.x,
          noseLerp.y
        );
        let rightVector = p.createVector(
          rightEyeLerp.x - noseLerp.x,
          rightEyeLerp.y - noseLerp.y
        );
        let leftVector = p.createVector(
          leftEyeLerp.x - noseLerp.x,
          leftEyeLerp.y - noseLerp.y
        );
        rightVector.mult(3.5).add(noseLerp.x, noseLerp.y);
        leftVector.mult(3.5).add(noseLerp.x, noseLerp.y);
        let mid = p5.Vector.add(rightVector, leftVector).div(2);
        let diff = p5.Vector.sub(rightVector, leftVector);
        let angle = diff.heading();
        p.push();
        p.translate(mid.x, mid.y);
        p.rotate(angle);
        p.fill(0);
        p.rectMode(p.CENTER);
        p.rect(0, 0, diff.mag(), dist, 20);
        // console.log(diff.mag(), dist);
        p.fill("white");
        p.textSize(14);
        // console.log(this.state.questionBlock.display.length);
        p.text(
          this.state.questionBlock.display,
          15,
          dist/2,
          // 0,
          diff.mag()/2,
          dist
        ); // Text wraps within text box
        p.pop();
      }
    };
  };

  componentDidMount() {
    this.myP5 = new p5(this.Sketch, this.myRef.current);
  }

  questionChanger = () => {
    // console.log(this.currentQuestionIndex, questions.questions.length);
    if (this.currentQuestionIndex >= questions.questions.length) {
      clearInterval(this.state.interval);
      this.currentQuestionIndex = 0;
      this.timerCount = 0;
      this.setState({
        questionBlock: { display: this.defaultText },
        showBeginButton: true
      });
      return;
    }
    // console.log("TIMER", this.timerCount);
    if (this.timerCount % 2 === 0) {
      this.timerCount++;
      this.setState({
        questionBlock: {
          display:
            questions.questions[this.currentQuestionIndex].question,
        },
      });
      // console.log(questions.questions[this.currentQuestionIndex]);
    } else {
      this.timerCount++;
      this.currentQuestionIndex++;
      this.setState({
        questionBlock: {
          display: questions.answers[this.currentQuestionIndex - 1].answer,
        }
      })
    }
  };

  beginExecution = () => {
    let interval = setInterval(this.questionChanger, 5000);
    this.setState({ interval: interval, questionBlock: {display: "Be Ready !! "}, showBeginButton: false });
  };

  render() {
    return (
      <>
        <div className="container" style={{width: window.innerWidth}}>
          <div className="canvas" ref={this.myRef}></div>
          {this.state.showBeginButton ? <div className="beginButton" onClick={() => this.beginExecution()}>
            Click to Begin
          </div> : <> </>}
        </div>
        {/* <button onClick={() => this.changeFilter()}>CHANGE FILTER</button> */}
        {/* <Capture /> */}
        {/* <Ml5tmimg /> */}
      </>
    );
  }
}

export default App;