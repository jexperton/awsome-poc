import { FC, useEffect, useState } from "react";
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Button,
  Flex,
} from "@chakra-ui/react";
import { Field, Form, Formik, FormikErrors } from "formik";
import { CheckIcon } from "@chakra-ui/icons";
import { SingleDatepicker } from "chakra-dayzed-datepicker";

import useIndex from "../../hooks/useIndex";
import Spinner from "../Spinner";
import FieldBox from "./FieldBox";

interface FormValues {
  title: string;
  url: string;
  date: Date;
}

interface Props {
  initialTitle: string;
  initialUrl: string;
  initialdate: Date;
}

const Add: FC<Props> = ({ initialTitle, initialUrl, initialdate }) => {
  const [saved, setSaved] = useState(false);
  const indexEntry = useIndex();

  const initialValues = {
    title: initialTitle,
    url: initialUrl,
    date: initialdate,
  };

  const validate = (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {};
    if (!values.title) errors.title = "Required";
    if (!values.url) errors.url = "Required";
    if (!values.date) errors.date = "Required";
    return errors;
  };

  const onSubmit = async (values: FormValues) => {
    await indexEntry(values);
    setSaved(true);
    return true;
  };

  useEffect(() => {
    if (saved === false) return;
    const timer = setTimeout(() => setSaved(false), 2000);
    return () => clearTimeout(timer);
  }, [saved]);

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validate={validate}
    >
      {({ setFieldValue, touched, errors, isSubmitting, submitForm }) => (
        <Form>
          <FieldBox>
            <Field name="title">
              {({ field }: any) => (
                <FormControl isInvalid={!!touched.title && !!errors.title}>
                  <FormLabel>Title</FormLabel>
                  <Input {...field} />
                  <FormErrorMessage>{errors.title}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </FieldBox>

          <FieldBox>
            <Field name="url">
              {({ field }: any) => (
                <FormControl isInvalid={!!touched.url && !!errors.url}>
                  <FormLabel>File URL</FormLabel>
                  <Input {...field} />
                  <FormErrorMessage>{errors.url}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </FieldBox>

          <FieldBox>
            <Field name="date">
              {({ field }: any) => (
                <FormControl isInvalid={!!touched.date && !!errors.date}>
                  <FormLabel>Broadcasted on</FormLabel>
                  <SingleDatepicker
                    name={field.name}
                    onDateChange={(value) => {
                      setFieldValue(field.name, value);
                    }}
                    date={field.value}
                  />
                  <FormErrorMessage>{errors.url}</FormErrorMessage>
                </FormControl>
              )}
            </Field>
          </FieldBox>

          <Flex alignItems={"center"}>
            <Button
              colorScheme="blue"
              variant={isSubmitting ? "outline" : "solid"}
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Add
            </Button>
            {isSubmitting && (
              <>
                <Spinner color={"blue.400"} marginLeft={3} marginRight={2} />{" "}
                {"Creating new entry"}
              </>
            )}
            {!isSubmitting && saved && (
              <>
                <CheckIcon color={"green.400"} marginLeft={3} marginRight={2} />{" "}
                {"Done"}
              </>
            )}
          </Flex>
        </Form>
      )}
    </Formik>
  );
};

export default Add;
