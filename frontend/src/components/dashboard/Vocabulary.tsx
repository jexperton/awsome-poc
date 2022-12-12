import { FC, useEffect, useState } from "react";
import { FormControl, FormLabel, Input, Button, Flex } from "@chakra-ui/react";
import { Field, FieldArray, Form, Formik, FormikErrors } from "formik";
import { CheckIcon } from "@chakra-ui/icons";

import type { Phrase } from "../../types";
import useIndex from "../../hooks/useIndex";
import Spinner from "../Spinner";
import useVocabulary from "../../hooks/useVocabulary";

interface FormValues {
  phrases: Phrase[];
}

const Vocabulary: FC<{}> = () => {
  const [saved, setSaved] = useState(false);
  const indexEntry = useIndex();
  const { vocabulary, updateVocabulary } = useVocabulary();

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
    console.log(values.phrases.slice(1));
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
              </tr>
            </thead>
            <tbody>
              <FieldArray name="phrases">
                {(arrayHelpers) =>
                  values.phrases.map((item, index) => (
                    <tr>
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
                    </tr>
                  ))
                }
              </FieldArray>
            </tbody>
          </table>
          <Flex alignItems={"center"}>
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

export default Vocabulary;
