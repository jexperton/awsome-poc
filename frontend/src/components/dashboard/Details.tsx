import { createRef, FC } from "react";
import {
  Tag,
  UseDisclosureProps,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Input,
  DrawerFooter,
  Button,
  FormControl,
  FormLabel,
  Box,
} from "@chakra-ui/react";
import { Field, Form, Formik } from "formik";

import { Entry } from "../../types";
import FieldBox from "./FieldBox";

type Props = UseDisclosureProps & { entry?: Entry };

const Details: FC<Props> = (props) => {
  const btnRef = createRef<any>();
  const playerRef = createRef<HTMLAudioElement>();

  const validate = () => {};

  const onSubmit = () => {};

  return (
    <Drawer
      isOpen={props.isOpen || false}
      placement="right"
      onClose={props.onClose || (() => {})}
      finalFocusRef={btnRef}
      size="sm"
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Entry details</DrawerHeader>

        <DrawerBody>
          {props.entry && (
            <>
              <Box marginTop={2} marginBottom={2}>
                <audio ref={playerRef} controls>
                  <source src={`${props.entry?.url}`} />
                </audio>
              </Box>
              <Formik
                initialValues={props.entry}
                onSubmit={onSubmit}
                validate={validate}
              >
                {({
                  setFieldValue,
                  touched,
                  errors,
                  isSubmitting,
                  submitForm,
                }) => (
                  <Form>
                    <FieldBox>
                      <Field name="title">
                        {({ field }: any) => (
                          <FormControl>
                            <FormLabel>Title</FormLabel>
                            <Input {...field} />
                          </FormControl>
                        )}
                      </Field>
                    </FieldBox>

                    <FieldBox>
                      <Field name="date">
                        {({ field }: any) => (
                          <FormControl>
                            <FormLabel>Date</FormLabel>
                            <Input {...field} readOnly />
                          </FormControl>
                        )}
                      </Field>
                    </FieldBox>

                    <FieldBox>
                      <FormLabel>
                        UUID <Tag color="gray.400">readonly</Tag>
                      </FormLabel>
                      <Input value={props.entry?.uuid} readOnly />
                    </FieldBox>

                    <FieldBox>
                      <FormLabel>
                        Source <Tag color="gray.400">readonly</Tag>
                      </FormLabel>
                      <Input value={props.entry?.url} readOnly />
                    </FieldBox>
                  </Form>
                )}
              </Formik>
              {(props.entry.entities || []).map((entity) => (
                <></>
              ))}
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          <Button
            variant="outline"
            mr={3}
            onClick={props.onClose || (() => {})}
          >
            Cancel
          </Button>
          <Button colorScheme="blue">Save</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Details;
