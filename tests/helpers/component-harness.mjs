import React from 'react';
import { loadSourceModule } from './backend-handler.mjs';

// Hook doubles for deterministic handler/race tests, not a browser navigation test.
export function componentHarness(url, dependencies, initialProps = {}) {
  const state=[],refs=[],effects=[];let stateIndex,refIndex,effectIndex,pending,props=initialProps,tree;
  const Component=loadSourceModule(url,{
    React,...dependencies,
    useState:initial=>{const i=stateIndex++;if(!(i in state))state[i]=initial;return [state[i],value=>{state[i]=typeof value==='function'?value(state[i]):value;}];},
    useRef:initial=>{const i=refIndex++;return refs[i] ||= {current:initial};},
    useEffect:(callback,deps)=>{const i=effectIndex++,previous=effects[i];if(!previous || deps.some((value,j)=>!Object.is(value,previous.deps[j])))pending.push(()=>{previous?.cleanup?.();effects[i]={deps,cleanup:callback()};});},
  });
  const walk=node=>!node||typeof node!=='object'?[]:[node,...React.Children.toArray(node.props?.children).flatMap(walk)];
  return {
    render(nextProps=props){props=nextProps;stateIndex=refIndex=effectIndex=0;pending=[];tree=Component(props);pending.forEach(run=>run());return tree;},
    nodes(){return walk(tree);},
    button(label){const found=walk(tree).find(node=>node.type==='Button'&&React.Children.toArray(node.props.children).some(child=>typeof child==='string'&&child.trim()===label));if(!found)throw new Error('Missing button: '+label);return found;},
    unmount(){effects.forEach(effect=>effect.cleanup?.());},
  };
}
