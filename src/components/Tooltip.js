//      
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

import Button from './Button';

import styles from './style';

                                     

              
                       
                      
                   
                   
                   
                    
  

const Tooltip = ({
  isFirstStep,
  isLastStep,
  handleNext,
  handlePrev,
  handleStop,
  currentStep,
}       ) => (
  <View>
    <TouchableOpacity onPress={handleNext}>
      <View style={styles.tooltipContainer}>
        <Text testID="stepDescription" style={styles.tooltipText}>{currentStep.text}</Text>
      </View>
    </TouchableOpacity>
    <View style={[styles.bottomBar]}>
      <TouchableOpacity onPress={handleNext}>
        <Button>OK</Button>
      </TouchableOpacity>
    </View>
  </View>
);

export default Tooltip;
