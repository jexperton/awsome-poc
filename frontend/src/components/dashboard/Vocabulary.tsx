import { createElement, FC, useEffect, useState } from "react";
import { FormControl, FormLabel, Input, Button, Flex } from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik, FormikErrors, useFormik } from "formik";
import { CheckIcon, SmallCloseIcon } from "@chakra-ui/icons";

import type { Phrase } from "../../types";
import Spinner from "../Spinner";
import useVocabulary from "../../hooks/useVocabulary";
import Loader from "../Loader";

interface FormValues {
  phrases: Phrase[];
}

const VocabularyInner: FC<ReturnType<typeof useVocabulary>> = ({
  vocabulary,
  updateVocabulary,
}) => {
  const [saved, setSaved] = useState(false);
  const { a } = useFormik();

  const initialValues: FormValues = {
    phrases: [{ phrase: "", soundsLike: "", ipa: "", displayAs: "" }].concat(
      vocabulary || []
    ),
  };

  const validate = (values: FormValues) => {
    let errors: FormikErrors<FormValues> = {};
    return errors;
  };

  const onSubmit = async (values: FormValues) => {
    await updateVocabulary(values.phrases.slice(1));
    setSaved(true);
    return true;
  };

  const removePhrase = async (
    phrases: FormValues["phrases"],
    index: number
  ) => {
    phrases = phrases.slice(1, index).concat(phrases.slice(index + 1))
    await updateVocabulary(phrases);
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
      {({
        values,
        setFieldValue,
        touched,
        errors,
        isSubmitting,
        submitForm,
      }) => (
        <Form>
          <table>
            <thead>
              <tr>
                <th>
                  <FormLabel>Phrase</FormLabel>
                </th>
                <th>
                  <FormLabel>Sounds Like</FormLabel>
                </th>
                <th>
                  <FormLabel>IPA</FormLabel>
                </th>
                <th>
                  <FormLabel>Display as</FormLabel>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              <FieldArray name="phrases">
                {(arrayHelpers) =>
                  values.phrases.map((item, index) => (
                    <tr key={`phrase-${index}`}>
                      <td>
                        <Field name={`phrases.${index + 1}.phrase`}>
                          {({ field }: any) => (
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          )}
                        </Field>
                      </td>
                      <td>
                        <Field name={`phrases.${index + 1}.soundsLike`}>
                          {({ field }: any) => (
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          )}
                        </Field>
                      </td>
                      <td>
                        <Field name={`phrases.${index + 1}.ipa`}>
                          {({ field }: any) => (
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          )}
                        </Field>
                      </td>
                      <td>
                        <Field name={`phrases.${index + 1}.displayAs`}>
                          {({ field }: any) => (
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                          )}
                        </Field>
                      </td>
                      <td>
                        <Button
                          variant="ghost"
                          onClick={() =>
                            removePhrase(values.phrases, index + 1)
                          }
                        >
                          <SmallCloseIcon color="gray.500" />
                        </Button>
                      </td>
                    </tr>
                  ))
                }
              </FieldArray>
            </tbody>
          </table>
          <Flex alignItems={"center"} marginTop={4}>
            <Button
              colorScheme="blue"
              variant={isSubmitting ? "outline" : "solid"}
              onClick={submitForm}
              disabled={isSubmitting}
            >
              Save
            </Button>
            {isSubmitting && (
              <>
                <Spinner color={"blue.400"} marginLeft={3} marginRight={2} />{" "}
                {"Saving..."}
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

const Vocabulary: FC<{}> = () => {
  const { vocabulary, updateVocabulary } = useVocabulary();
  console.log(vocabulary)
  return vocabulary ? (
    createElement(VocabularyInner, { vocabulary, updateVocabulary })
  ) : (
    <Loader />
  );
};

export default Vocabulary;
