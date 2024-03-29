import React from 'react';

import { ErrorPage } from '@edx/frontend-platform/react';
import { Modal } from '@edx/paragon';
import { shallow } from '@edx/react-unit-test-utils';

import PageLoading from '../../../../generic/PageLoading';

import * as hooks from './hooks';
import ContentIFrame, { IFRAME_FEATURE_POLICY, testIDs } from './ContentIFrame';

jest.mock('@edx/frontend-platform/react', () => ({ ErrorPage: 'ErrorPage' }));

jest.mock('@edx/paragon', () => ({ Modal: 'Modal' }));

jest.mock('../../../../generic/PageLoading', () => 'PageLoading');

jest.mock('./hooks', () => ({
  useIFrameBehavior: jest.fn(),
  useModalIFrameData: jest.fn(),
}));

const iframeBehavior = {
  handleIFrameLoad: jest.fn().mockName('IFrameBehavior.handleIFrameLoad'),
  hasLoaded: false,
  iframeHeight: 20,
  showError: false,
};

const modalOptions = {
  closed: {
    open: false,
  },
  withBody: {
    body: 'test-body',
    open: true,
  },
  withUrl: {
    open: true,
    title: 'test-modal-title',
    url: 'test-modal-url',
  },
};

const modalIFrameData = {
  modalOptions: modalOptions.closed,
  handleModalClose: jest.fn().mockName('modalIFrameOptions.handleModalClose'),
};

hooks.useIFrameBehavior.mockReturnValue(iframeBehavior);
hooks.useModalIFrameData.mockReturnValue(modalIFrameData);

const props = {
  iframeUrl: 'test-iframe-url',
  shouldShowContent: true,
  loadingMessage: 'test-loading-message',
  id: 'test-id',
  elementId: 'test-element-id',
  onLoaded: jest.fn().mockName('props.onLoaded'),
  title: 'test-title',
};

let el;
describe('ContentIFrame Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('behavior', () => {
    beforeEach(() => {
      el = shallow(<ContentIFrame {...props} />);
    });
    it('initializes iframe behavior hook', () => {
      expect(hooks.useIFrameBehavior).toHaveBeenCalledWith({
        elementId: props.elementId,
        id: props.id,
        iframeUrl: props.iframeUrl,
        onLoaded: props.onLoaded,
      });
    });
    it('initializes modal iframe data', () => {
      expect(hooks.useModalIFrameData).toHaveBeenCalledWith();
    });
  });
  describe('output', () => {
    let component;
    describe('shouldShowContent', () => {
      describe('if not hasLoaded', () => {
        it('displays errorPage if showError', () => {
          hooks.useIFrameBehavior.mockReturnValueOnce({ ...iframeBehavior, showError: true });
          el = shallow(<ContentIFrame {...props} />);
          expect(el.instance.findByType(ErrorPage).length).toEqual(1);
        });
        it('displays PageLoading component if not showError', () => {
          el = shallow(<ContentIFrame {...props} />);
          [component] = el.instance.findByType(PageLoading);
          expect(component.props.srMessage).toEqual(props.loadingMessage);
        });
      });
      describe('hasLoaded', () => {
        it('does not display PageLoading or ErrorPage', () => {
          hooks.useIFrameBehavior.mockReturnValueOnce({ ...iframeBehavior, hasLoaded: true });
          el = shallow(<ContentIFrame {...props} />);
          expect(el.instance.findByType(PageLoading).length).toEqual(0);
          expect(el.instance.findByType(ErrorPage).length).toEqual(0);
        });
      });
      it('display iframe with props from hooks', () => {
        el = shallow(<ContentIFrame {...props} />);
        [component] = el.instance.findByTestId(testIDs.contentIFrame);
        expect(component.props).toEqual({
          allow: IFRAME_FEATURE_POLICY,
          allowFullScreen: true,
          scrolling: 'no',
          referrerPolicy: 'origin',
          title: props.title,
          id: props.elementId,
          src: props.iframeUrl,
          height: iframeBehavior.iframeHeight,
          onLoad: iframeBehavior.handleIFrameLoad,
          'data-testid': testIDs.contentIFrame,
        });
      });
    });
    describe('not shouldShowContent', () => {
      it('does not show PageLoading, ErrorPage, or unit-iframe-wrapper', () => {
        el = shallow(<ContentIFrame {...{ ...props, shouldShowContent: false }} />);
        expect(el.instance.findByType(PageLoading).length).toEqual(0);
        expect(el.instance.findByType(ErrorPage).length).toEqual(0);
        expect(el.instance.findByTestId(testIDs.contentIFrame).length).toEqual(0);
      });
    });
    it('does not display modal if modalOptions returns open: false', () => {
      el = shallow(<ContentIFrame {...props} />);
      expect(el.instance.findByType(Modal).length).toEqual(0);
    });
    describe('if modalOptions.open', () => {
      const testModalOpenAndHandleClose = () => {
        test('Modal component is open, with handleModalClose from hook', () => {
          expect(component.props.onClose).toEqual(modalIFrameData.handleModalClose);
        });
      };
      describe('body modal', () => {
        beforeEach(() => {
          hooks.useModalIFrameData.mockReturnValueOnce({ ...modalIFrameData, modalOptions: modalOptions.withBody });
          el = shallow(<ContentIFrame {...props} />);
          [component] = el.instance.findByType(Modal);
        });
        it('displays Modal with div wrapping provided body content if modal.body is provided', () => {
          expect(component.props.body).toEqual(<div className="unit-modal">{modalOptions.withBody.body}</div>);
        });
        testModalOpenAndHandleClose();
      });
      describe('url modal', () => {
        beforeEach(() => {
          hooks.useModalIFrameData.mockReturnValueOnce({ ...modalIFrameData, modalOptions: modalOptions.withUrl });
          el = shallow(<ContentIFrame {...props} />);
          [component] = el.instance.findByType(Modal);
        });
        testModalOpenAndHandleClose();
        it('displays Modal with iframe to provided url if modal.body is not provided', () => {
          expect(component.props.body).toEqual(
            <iframe
              title={modalOptions.withUrl.title}
              allow={IFRAME_FEATURE_POLICY}
              frameBorder="0"
              src={modalOptions.withUrl.url}
              style={{ width: '100%', height: '100vh' }}
            />,
          );
        });
      });
    });
  });
});
