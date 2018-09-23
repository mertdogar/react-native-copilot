//
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { View } from 'react-native';

import EventEmitterExtra from 'event-emitter-extra';
import hoistStatics from 'hoist-non-react-statics';

import CopilotModal from '../components/CopilotModal';
import { OFFSET_WIDTH } from '../components/style';

import { getFirstStep, getLastStep, getStepNumber, getPrevStep, getNextStep } from '../utilities';



/*
This is the maximum wait time for the steps to be registered before starting the tutorial
At 60fps means 2 seconds
*/
const MAX_START_TRIES = 120;









const copilot = ({
  overlay,
  tooltipComponent,
  stepNumberComponent,
  animated,
  androidStatusBarVisible,
  backdropColor,
} = {}) =>
  (WrappedComponent) => {
    class Copilot extends Component             {
      steps = {};
      currentStep = null;

      state = {
        steps: {},
        currentStep: null,
        visible: false,
      };

      getChildContext()                               {
        return {
          _copilot: {
            registerStep: this.registerStep,
            unregisterStep: this.unregisterStep,
            getCurrentStep: () => this.currentStep,
          },
        };
      }

      componentDidMount() {
        this.mounted = true;
      }

      componentWillUnmount() {
        this.mounted = false;
      }

      getStepNumber = (step        = this.currentStep)         =>
        getStepNumber(this.steps, step);

      getFirstStep = ()        => getFirstStep(this.steps);

      getLastStep = ()        => getLastStep(this.steps);

      getPrevStep = (step        = this.currentStep)        =>
        getPrevStep(this.steps, step);

      getNextStep = (step        = this.currentStep)        =>
        getNextStep(this.steps, step);

      setCurrentStep = async (step      , move           = true)       => {
        this.currentStep = step;
        await this.setStatePromise({ currentStep: step.name, currentStepHidden: false });
        this.eventEmitter.emit('stepChange', step);
        if (move) {
          this.moveToCurrentStep();
        }
      }

      setVisibility = (visible         )       => new Promise((resolve) => {
        this.setState({ visible }, () => resolve());
      });

      setStatePromise = (visible         )       => new Promise((resolve) => {
        this.setState(visible , (err) => {
          resolve()
        });
      });

      startTries = 0;

      mounted = false;

      eventEmitter = new EventEmitterExtra();

      isFirstStep = ()          => this.currentStep === this.getFirstStep();

      isLastStep = ()          => this.currentStep === this.getLastStep();

      registerStep = (step      )       => {
        this.steps[step.name] = step;

        this.setState(({ steps }) => ({
          steps: {
            ...steps,
            [step.name]: step.name,
          },
        }));
      }

      unregisterStep = (stepName        )       => {
        if (!this.mounted) {
          return;
        }

        delete this.steps[stepName];

        this.setState(({ steps }) => ({
          steps: Object.entries(steps)
            .filter(([key]) => key !== stepName)
            .reduce((obj, [key, val]) => Object.assign(obj, { [key]: val }), {}),
        }));
      }

      next = async ()       => {
        if (this.eventEmitter.listenerCount('willGoNext')) {
          this.currentStep.hide = true;
          await this.setStatePromise({currentStepHidden: true});
          const response = await this.eventEmitter.emitAsync('willGoNext', this.currentStep);
          if (response.includes('stop'))
            return this.stop();
        }
        await this.setCurrentStep(this.getNextStep());
      }

      prev = async ()       => {
        if (this.eventEmitter.listenerCount('willGoPrev')) {
          this.currentStep.hide = true;
          await this.setStatePromise({currentStepHidden: true});
          await this.eventEmitter.emitAsync('willGoPrev', this.currentStep);
        }
        await this.setCurrentStep(this.getPrevStep());
      }

      start = async (fromStep         )       => {
        const { steps } = this.state;

        const currentStep = fromStep
          ? this.steps[fromStep]
          : this.getFirstStep();

        if (this.startTries > MAX_START_TRIES) {
          this.startTries = 0;
          return;
        }

        if (!currentStep) {
          this.startTries += 1;
          requestAnimationFrame(() => this.start(fromStep));
        } else {
          this.eventEmitter.emit('start');
          await this.setCurrentStep(currentStep);
          await this.moveToCurrentStep();
          await this.setVisibility(true);
          this.startTries = 0;
        }
      }

      stop = async ()       => {
        await this.setVisibility(false);
        this.eventEmitter.emit('stop');
      }

      async moveToCurrentStep()       {
        const size = await this.currentStep.target.measure();

        await this.modal.animateMove({
          width: size.width + OFFSET_WIDTH,
          height: size.height + OFFSET_WIDTH,
          left: size.x - (OFFSET_WIDTH / 2),
          top: size.y - (OFFSET_WIDTH / 2),
        });
      }

      render() {
        return (
          <View style={{ flex: 1, backgroundColor: 'red' }}>
            <WrappedComponent
              {...this.props}
              start={this.start}
              stop={this.stop}
              currentStep={this.steps[this.state.currentStep]}
              visible={this.state.visible}
              copilotEvents={this.eventEmitter}
            />
            <CopilotModal
              next={this.next}
              prev={this.prev}
              stop={this.stop}
              visible={this.state.visible}
              isFirstStep={this.isFirstStep()}
              isLastStep={this.isLastStep()}
              currentStepNumber={this.getStepNumber()}
              currentStep={this.steps[this.state.currentStep]}
              stepNumberComponent={stepNumberComponent}
              tooltipComponent={tooltipComponent}
              overlay={overlay}
              animated={animated}
              androidStatusBarVisible={androidStatusBarVisible}
              backdropColor={backdropColor}
              ref={(modal) => { this.modal = modal; }}
            />
          </View>
        );
      }
    }

    Copilot.childContextTypes = {
      _copilot: PropTypes.object.isRequired,
    };

    return hoistStatics(Copilot, WrappedComponent);
  };

export default copilot;
